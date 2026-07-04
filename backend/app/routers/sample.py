"""The one-free-sample endpoint: auth, global + per-user quota gates, then a
concurrency-bounded preview run. Nothing is saved as a deliverable and there
is no review loop — preview only. The run row IS persisted so samples are
countable for the global daily cap and auditable for cost."""

import logging

from fastapi import APIRouter, HTTPException, Request, status
from starlette.concurrency import run_in_threadpool

from app import config, db, limits, runner
from app.auth import UserId
from app.limits import limiter
from app.schemas import ReportRequest, SampleResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sample"])


@router.post("/sample", response_model=SampleResponse)
@limiter.limit(config.rate_limit_per_ip, key_func=limits.ip_key)
@limiter.limit(config.rate_limit_per_user, key_func=limits.user_key)
async def create_sample(
    request: Request,  # noqa: ARG001 — required by slowapi; the body is `report`
    report: ReportRequest,
    user_id: UserId,
) -> SampleResponse:
    # Account-level spend guard FIRST — a capacity rejection must not consume
    # the caller's one free sample. Friendly 503, never a 500.
    samples_today = await run_in_threadpool(db.count_sample_runs_today)
    if not limits.sample_capacity_available(samples_today):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sample capacity reached for today — please try again later.",
        )
    # Per-user quota: free = exactly one sample, ever (atomic flip).
    if not await run_in_threadpool(db.claim_free_sample, user_id):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Free sample already used — run a full campaign instead.",
        )

    business = report.to_business()
    project_id = await run_in_threadpool(db.create_project, user_id, business)
    run_id = await run_in_threadpool(db.create_run, user_id, project_id, "sample")
    try:
        # Bounded by the global concurrency slot (rule 7).
        result = await limits.run_with_slot(runner.run_sample, run_id, user_id, business)
    except Exception as exc:
        # They got nothing — refund the quota and fail clearly (rule 6). The
        # run row is already marked failed by run_sample.
        await run_in_threadpool(db.release_free_sample, user_id)
        logger.exception("sample run failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sample generation failed; your free sample was not consumed.",
        ) from exc
    return SampleResponse(
        preview=True,
        upgrade_hint=str(result.get("upgrade_hint", "")),
        result=result,
    )
