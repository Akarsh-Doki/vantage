"""API request/response models — strict Pydantic v2 (CLAUDE.md rule 1).

URLs are validated for shape only (http/https); nothing is fetched here —
user-supplied URLs are fetched exclusively by the Go fetcher inside the
graph (rule 4).
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl

BusinessType = Literal[
    "local_service",
    "restaurant",
    "ecommerce_dtc",
    "startup_saas",
    "b2b",
    "creator_personal_brand",
]
Goal = Literal[
    "awareness",
    "foot_traffic",
    "lead_generation",
    "product_launch",
    "loyalty_retention",
    "virality",
    "trust_credibility",
]
Budget = Literal["zero", "low", "medium", "high"]
RunStatusValue = Literal["queued", "running", "awaiting_review", "completed", "failed"]


class ReportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    business_name: str = Field(min_length=1, max_length=120)
    business_description: str = Field(default="", max_length=2000)
    industry: str = Field(min_length=1, max_length=120)
    business_type: BusinessType
    goal: Goal
    budget: Budget
    website_url: HttpUrl
    competitor_urls: list[HttpUrl] = Field(default_factory=list, max_length=5)

    def to_business(self) -> dict[str, Any]:
        """The business dict the graph's nodes expect."""
        return {
            "name": self.business_name,
            "description": self.business_description,
            "industry": self.industry,
            "business_type": self.business_type,
            "goal": self.goal,
            "budget": self.budget,
            "website_url": str(self.website_url),
            "competitor_urls": [str(url) for url in self.competitor_urls],
        }


class ApproveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    approved: bool
    feedback: str | None = Field(default=None, max_length=2000)


class RenameRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)


class RenameResponse(BaseModel):
    run_id: str
    name: str


class RunCreated(BaseModel):
    run_id: str
    status: RunStatusValue


class RunSummary(BaseModel):
    run_id: str
    kind: str
    status: str
    current_step: str | None = None
    created_at: str | None = None
    # user-chosen name, falling back to the project's business name
    name: str | None = None


class RunListResponse(BaseModel):
    runs: list[RunSummary]


class ReportPayload(BaseModel):
    """The stored deliverable. brief/strategy are structured sections
    ({headline?, paragraphs: [{text, cites: [n]}]}); creative concepts carry
    source_n numeric citations; sources is the numbered citation list
    ([{n, title, url}]). list[Any] on sources tolerates legacy rows that
    stored plain URL strings."""

    brief: dict[str, Any] | None = None
    strategy: dict[str, Any] | None = None
    creative: list[dict[str, Any]] | None = None
    sources: list[Any] | None = None


class RunStatus(BaseModel):
    run_id: str
    kind: str
    status: str
    current_step: str | None = None
    error: str | None = None
    name: str | None = None
    # the project's business name (for display and the export filename)
    business_name: str | None = None
    created_at: str | None = None
    report: ReportPayload | None = None


class DeleteResponse(BaseModel):
    run_id: str
    deleted: bool
