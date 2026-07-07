"""The one-free-sample endpoint: auth, global + per-user quota gates, then the
same async run lifecycle as full reports (202 + run_id; the frontend polls
GET /reports/{id}). The sample deliverable IS persisted, so a finished sample
can be reopened from the dashboard exactly like a full report. If the
background run fails, execute_run refunds the user's one free sample."""

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from starlette.concurrency import run_in_threadpool

from app import config, db, limits, runner
from app.auth import UserId
from app.limits import limiter
from app.schemas import ReportRequest, RunCreated

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sample"])


@router.post("/sample", response_model=RunCreated, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(config.rate_limit_per_ip, key_func=limits.ip_key)
@limiter.limit(config.rate_limit_per_user, key_func=limits.user_key)
async def create_sample(
    request: Request,  # noqa: ARG001 — required by slowapi; the body is `report`
    report: ReportRequest,
    user_id: UserId,
    background: BackgroundTasks,
) -> RunCreated:
    # Account-level spend guard FIRST — a capacity rejection must not consume
    # the caller's one free sample. Friendly 503, never a 500.
    samples_today = await run_in_threadpool(db.count_sample_runs_today)
    if not limits.sample_capacity_available(samples_today):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sample capacity reached for today. Please try again later.",
        )
    # Per-user quota: free = exactly one sample, ever (atomic flip). A failed
    # run refunds it inside execute_run.
    if not await run_in_threadpool(db.claim_free_sample, user_id):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Free sample already used. Run a full campaign instead.",
        )

    business = report.to_business()
    project_id = await run_in_threadpool(db.create_project, user_id, business)
    run_id = await run_in_threadpool(db.create_run, user_id, project_id, "sample")
    # Bound concurrent graph runs with the global slot (rule 7), same as /reports.
    background.add_task(
        limits.run_with_slot, runner.execute_run, run_id, project_id, user_id, business, "sample"
    )
    return RunCreated(run_id=run_id, status="queued")
