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
    request: Request,
    report: ReportRequest,
    user_id: UserId,
    background: BackgroundTasks,
) -> RunCreated:
    # A capacity rejection from the account-level spend guard must not consume the caller's one free sample. Return a friendly 503, never a 500.
    samples_today = await run_in_threadpool(db.count_sample_runs_today)
    if not limits.sample_capacity_available(samples_today):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sample capacity reached for today. Please try again later.",
        )

    if not await run_in_threadpool(db.claim_free_sample, user_id):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Free sample already used. Run a full campaign instead.",
        )

    business = report.to_business()
    # Snapshot names before creating this run so it never collides with itself.
    taken = await run_in_threadpool(db.existing_run_names, user_id)
    project_id = await run_in_threadpool(db.create_project, user_id, business)
    run_id = await run_in_threadpool(db.create_run, user_id, project_id, "sample")
    numbered = db.disambiguate_name(str(business["name"]), taken)
    if numbered:
        await run_in_threadpool(db.rename_run, run_id, user_id, numbered)
    # Bound concurrent graph runs with the global slot (rule 7), same as /reports.
    background.add_task(
        limits.run_with_slot, runner.execute_run, run_id, project_id, user_id, business, "sample"
    )
    return RunCreated(run_id=run_id, status="queued")
