from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Effort = Literal["easy", "medium", "hard"]
Stroke = Literal["freestyle", "backstroke", "breaststroke", "butterfly", "mixed", "choice"]
StepKind = Literal[
    "continuous",
    "intervals",
    "pyramid",
    "descending",
    "ascending",
    "build",
    "negative_split",
    "broken",
    "fartlek",
    "time_trial",
]
SwimLevel = Literal["beginner", "intermediate", "advanced"]

PYRAMID_KINDS: frozenset[str] = frozenset({"pyramid", "descending", "ascending"})


class SessionRequested(BaseModel):
    model_config = ConfigDict(extra="forbid")

    duration_minutes: int = Field(gt=0)
    effort: Effort
    requested_tags: list[str] = Field(default_factory=list)
    swim_level: Optional[SwimLevel] = None


class Step(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step_id: str = Field(min_length=1)
    kind: StepKind
    reps: int = Field(gt=0)
    distance_per_rep_m: int = Field(gt=0)
    pyramid_sequence_m: Optional[list[int]] = None
    stroke: Stroke
    rest_seconds: Optional[int] = Field(default=None, ge=0)
    sendoff_seconds: Optional[int] = Field(default=None, ge=1)
    rest_sequence_s: Optional[list[int]] = None
    sendoff_sequence_s: Optional[list[int]] = None
    effort: Effort
    description: str = Field(min_length=1)
    hypoxic: Optional[bool] = None
    underwater: Optional[bool] = None
    fins: Optional[bool] = None
    pull: Optional[bool] = None
    paddles: Optional[bool] = None
    broken_pause_s: Optional[int] = None
    target_time_s: Optional[int] = None
    split_instruction: Optional[str] = None

    @property
    def step_distance_m(self) -> int:
        if self.kind in PYRAMID_KINDS and self.pyramid_sequence_m:
            return sum(self.pyramid_sequence_m)
        return self.reps * self.distance_per_rep_m


class Section(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    section_distance_m: int = Field(ge=0)
    steps: list[Step] = Field(min_length=1)


class Sections(BaseModel):
    model_config = ConfigDict(extra="forbid")

    warm_up: Section
    main_set: Section
    cool_down: Section


class SwimPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_id: UUID
    created_at: datetime
    duration_minutes: int = Field(gt=0)
    estimated_distance_m: int = Field(ge=0)
    sections: Sections


class HistoricSession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    session_plan: dict[str, Any] = Field(default_factory=dict)
    thumb: Literal[0, 1]
    tags: list[str] = Field(default_factory=list)


class SwimPlanInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_requested: SessionRequested
    historic_sessions: list[HistoricSession] = Field(default_factory=list)
    requested_tags: list[str] = Field(default_factory=list)


class LLMPlanDraftStep(BaseModel):
    model_config = ConfigDict(extra="ignore")

    step_id: Optional[str] = None
    kind: StepKind
    reps: int = Field(gt=0)
    distance_per_rep_m: int = Field(gt=0)
    pyramid_sequence_m: Optional[list[int]] = None
    stroke: Stroke
    rest_seconds: Optional[int] = Field(default=None, ge=0)
    sendoff_seconds: Optional[int] = Field(default=None, ge=1)
    rest_sequence_s: Optional[list[int]] = None
    sendoff_sequence_s: Optional[list[int]] = None
    effort: Effort
    description: str = ""
    hypoxic: Optional[bool] = None
    underwater: Optional[bool] = None
    fins: Optional[bool] = None
    pull: Optional[bool] = None
    paddles: Optional[bool] = None
    broken_pause_s: Optional[int] = None
    target_time_s: Optional[int] = None
    split_instruction: Optional[str] = None


class LLMPlanDraftSection(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str = ""
    section_distance_m: Optional[int] = Field(default=None, ge=0)
    steps: list[LLMPlanDraftStep] = Field(default_factory=list)


class LLMPlanDraftSections(BaseModel):
    model_config = ConfigDict(extra="ignore")

    warm_up: LLMPlanDraftSection
    main_set: LLMPlanDraftSection
    cool_down: LLMPlanDraftSection


class LLMPlanDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")

    plan_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    estimated_distance_m: Optional[int] = Field(default=None, ge=0)
    sections: LLMPlanDraftSections
