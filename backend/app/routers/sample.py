"""The one-free-sample endpoint: auth, quota gate, synchronous preview run.
Nothing is saved and there is no review loop — preview only."""

import logging

from fastapi import APIRouter, HTTPException, status

from app import db, runner
from app.auth import UserId
from app.schemas import ReportRequest, SampleResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sample"])


@router.post("/sample", response_model=SampleResponse)
def create_sample(request: ReportRequest, user_id: UserId) -> SampleResponse:
    if not db.claim_free_sample(user_id):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Free sample already used — run a full campaign instead",
        )
    try:
        result = runner.run_sample(user_id, request.to_business())
    except Exception as exc:
        # They got nothing — refund the quota and fail clearly (rule 6).
        db.release_free_sample(user_id)
        logger.exception("sample run failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Sample generation failed; your free sample was not consumed",
        ) from exc
    return SampleResponse(
        preview=True,
        upgrade_hint=str(result.get("upgrade_hint", "")),
        result=result,
    )
