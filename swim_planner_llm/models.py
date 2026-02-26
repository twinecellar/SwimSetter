from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Effort = Literal["easy", "medium", "hard"]
FunMode = Literal["straightforward", "varied"]
Stroke = Literal["freestyle", "backstroke", "breaststroke", "butterfly", "mixed", "choice"]
StepKind = Literal["continuous", "intervals"]


class SessionRequested(BaseModel):
    model_config = ConfigDict(extra="forbid")

    duration_minutes: int = Field(gt=0)
    effort: Effort
    fun_mode: FunMode


class Step(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step_id: str = Field(min_length=1)
    kind: StepKind
    reps: int = Field(gt=0)
    distance_per_rep_m: int = Field(gt=0)
    stroke: Stroke
    rest_seconds: Optional[int] = Field(default=None, ge=0)
    effort: Effort
    description: str = Field(min_length=1)

    @property
    def step_distance_m(self) -> int:
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


class LLMPlanDraftStep(BaseModel):
    model_config = ConfigDict(extra="ignore")

    step_id: Optional[str] = None
    kind: StepKind
    reps: int = Field(gt=0)
    distance_per_rep_m: int = Field(gt=0)
    stroke: Stroke
    rest_seconds: Optional[int] = Field(default=None, ge=0)
    effort: Effort
    description: str = ""


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
