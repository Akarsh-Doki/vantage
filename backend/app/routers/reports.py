"""Report endpoints. Every route requires a verified user (auth.UserId) and
every query is owner-scoped in db.py — nothing here trusts client-sent ids."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status

from app import config, db, limits, runner
from app.auth import UserId
from app.limits import limiter
from app.schemas import (
    ApproveRequest,
    DeleteResponse,
    RenameRequest,
    RenameResponse,
    ReportPayload,
    ReportRequest,
    RunCreated,
    RunListResponse,
    RunStatus,
    RunSummary,
)

router = APIRouter(prefix="/reports", tags=["reports"])


def _run_name(run: dict[str, object]) -> str | None:
    """The user-chosen display name, falling back to the project's business
    name (embedded by db.get_run/list_runs)."""
    display = run.get("display_name")
    if display:
        return str(display)
    project = run.get("projects") or {}
    business = project.get("business_name") if isinstance(project, dict) else None
    return str(business) if business else None


@router.post("", response_model=RunCreated, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(config.rate_limit_per_ip, key_func=limits.ip_key)
@limiter.limit(config.rate_limit_per_user, key_func=limits.user_key)
def create_report(
    request: Request,  # noqa: ARG001 — required by slowapi; the body is `report`
    report: ReportRequest,
    user_id: UserId,
    background: BackgroundTasks,
) -> RunCreated:
    # Per-user durable quota: full runs are paid-only and bounded per day.
    profile = db.get_profile(user_id)
    allowed, reason = limits.full_run_decision(
        (profile or {}).get("plan"), db.count_user_runs_today(user_id)
    )
    if not allowed:
        code = (
            status.HTTP_429_TOO_MANY_REQUESTS
            if (profile or {}).get("plan") == "paid"
            else status.HTTP_402_PAYMENT_REQUIRED
        )
        raise HTTPException(status_code=code, detail=reason)

    business = report.to_business()
    project_id = db.create_project(user_id, business)
    run_id = db.create_run(user_id, project_id, kind="full")
    # Bound concurrent graph runs with the global slot (rule 7).
    background.add_task(
        limits.run_with_slot, runner.execute_run, run_id, project_id, user_id, business, "full"
    )
    return RunCreated(run_id=run_id, status="queued")


@router.get("", response_model=RunListResponse)
def list_reports(user_id: UserId) -> RunListResponse:
    # A completed run is listed only when its deliverable is openable: this
    # drops soft-deleted reports AND legacy sample runs that never stored one
    # (their detail GET would 404). In-flight and failed runs always show.
    openable = db.report_run_ids(user_id)
    return RunListResponse(
        runs=[
            RunSummary(
                run_id=str(run["id"]),
                kind=str(run["kind"]),
                status=str(run["status"]),
                current_step=run.get("current_step"),
                created_at=run.get("created_at"),
                name=_run_name(run),
            )
            for run in db.list_runs(user_id)
            if str(run["status"]) != "completed" or str(run["id"]) in openable
        ]
    )


@router.get("/{run_id}", response_model=RunStatus)
def get_report(run_id: UUID, user_id: UserId) -> RunStatus:
    run = db.get_run(str(run_id), user_id)
    if run is None:  # not found OR not the caller's — indistinguishable on purpose
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    report_payload = None
    if run["status"] == "completed":
        report = db.get_report(str(run_id), user_id)  # excludes soft-deleted
        if report is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        report_payload = ReportPayload(
            brief=report.get("brief"),
            strategy=report.get("strategy"),
            creative=report.get("creative"),
            sources=report.get("sources"),
        )
    return RunStatus(
        run_id=str(run["id"]),
        kind=str(run["kind"]),
        status=str(run["status"]),
        current_step=run.get("current_step"),
        error=run.get("error"),
        name=_run_name(run),
        report=report_payload,
    )


@router.patch("/{run_id}", response_model=RenameResponse)
def rename_report(run_id: UUID, request: RenameRequest, user_id: UserId) -> RenameResponse:
    # Owner-scoped update; a miss (not found OR not the caller's) is a 404,
    # indistinguishable on purpose, same as GET.
    if not db.rename_run(str(run_id), user_id, request.name):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return RenameResponse(run_id=str(run_id), name=request.name)


@router.post("/{run_id}/approve", response_model=RunCreated)
def approve_report(
    run_id: UUID, request: ApproveRequest, user_id: UserId, background: BackgroundTasks
) -> RunCreated:
    run = db.get_run(str(run_id), user_id)
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if run["status"] != "awaiting_review":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Run is not awaiting review"
        )
    db.update_run(str(run_id), user_id, {"status": "running", "current_step": "finalizing"})
    background.add_task(
        runner.resume_run,
        str(run_id),
        str(run["project_id"]),
        user_id,
        str(run["kind"]),
        request.model_dump(),
    )
    return RunCreated(run_id=str(run_id), status="running")


@router.delete("/{run_id}", response_model=DeleteResponse)
def delete_report(run_id: UUID, user_id: UserId) -> DeleteResponse:
    if not db.soft_delete_report(str(run_id), user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return DeleteResponse(run_id=str(run_id), deleted=True)
