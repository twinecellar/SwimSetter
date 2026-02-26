from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4, uuid5

from pydantic import ValidationError

from .models import (
    HistoricSession,
    LLMPlanDraft,
    Section,
    Sections,
    SessionRequested,
    Step,
    SwimPlanResponse,
)


class ValidationIssue(ValueError):
    pass


def _step_signature(step: Step) -> tuple:
    return (step.kind, step.distance_per_rep_m, step.stroke, step.rest_seconds, step.effort)


def _has_sensitive_down_feedback(historic_sessions: list[HistoricSession]) -> bool:
    risk_tags = {"pace-too-fast", "long", "tiring"}
    for session in historic_sessions:
        if session.thumb != 0:
            continue
        lowered = {tag.strip().lower() for tag in session.tags}
        if lowered.intersection(risk_tags):
            return True
    return False


def validate_schema(plan: SwimPlanResponse) -> None:
    try:
        SwimPlanResponse.model_validate(plan.model_dump())
    except ValidationError as exc:
        raise ValidationIssue(f"schema validation failed: {exc}") from exc


def validate_invariants(
    plan: SwimPlanResponse,
    request: SessionRequested,
    historic_sessions: list[HistoricSession],
) -> None:
    warm_sum = sum(s.step_distance_m for s in plan.sections.warm_up.steps)
    main_sum = sum(s.step_distance_m for s in plan.sections.main_set.steps)
    cool_sum = sum(s.step_distance_m for s in plan.sections.cool_down.steps)

    if warm_sum != plan.sections.warm_up.section_distance_m:
        raise ValidationIssue("warm_up section_distance_m does not match step sum")
    if main_sum != plan.sections.main_set.section_distance_m:
        raise ValidationIssue("main_set section_distance_m does not match step sum")
    if cool_sum != plan.sections.cool_down.section_distance_m:
        raise ValidationIssue("cool_down section_distance_m does not match step sum")

    total = warm_sum + main_sum + cool_sum
    if total != plan.estimated_distance_m:
        raise ValidationIssue("estimated_distance_m does not match total section distances")

    if request.fun_mode == "straightforward":
        signatures = {_step_signature(step) for step in plan.sections.main_set.steps}
        if len(signatures) > 1:
            raise ValidationIssue(
                "straightforward mode requires one main_set pattern signature"
            )

    if _has_sensitive_down_feedback(historic_sessions):
        for step in plan.sections.main_set.steps:
            if step.kind == "continuous" and step.effort == "hard" and step.step_distance_m > 500:
                raise ValidationIssue(
                    "main_set contains long hard continuous block despite sensitive thumbs-down history"
                )


def _deterministic_plan_id(request: SessionRequested, seed: int) -> UUID:
    return uuid5(UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"), f"{request.model_dump_json()}|{seed}")


def _deterministic_created_at(seed: int) -> datetime:
    base = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return base + timedelta(seconds=int(seed))


def _convert_steps(
    steps_in: list,
    prefix: str,
    default_description: str,
) -> list[Step]:
    out: list[Step] = []
    for idx, s in enumerate(steps_in, start=1):
        step = Step(
            step_id=(s.step_id or "").strip() or f"{prefix}-{idx}",
            kind=s.kind,
            reps=s.reps,
            distance_per_rep_m=s.distance_per_rep_m,
            stroke=s.stroke,
            rest_seconds=s.rest_seconds,
            effort=s.effort,
            description=(s.description or "").strip() or default_description,
        )
        out.append(step)
    return out


def enforce_and_normalize(
    draft: LLMPlanDraft,
    request: SessionRequested,
    seed: Optional[int],
) -> SwimPlanResponse:
    try:
        warm_steps = _convert_steps(draft.sections.warm_up.steps, "wu", "Auto-generated warm-up step")
        main_steps = _convert_steps(draft.sections.main_set.steps, "main", "Auto-generated main step")
        cool_steps = _convert_steps(draft.sections.cool_down.steps, "cd", "Auto-generated cool-down step")

        sections = Sections(
            warm_up=Section(
                title=draft.sections.warm_up.title.strip() or "Warm-Up",
                steps=warm_steps,
                section_distance_m=sum(s.step_distance_m for s in warm_steps),
            ),
            main_set=Section(
                title=draft.sections.main_set.title.strip() or "Main Set",
                steps=main_steps,
                section_distance_m=sum(s.step_distance_m for s in main_steps),
            ),
            cool_down=Section(
                title=draft.sections.cool_down.title.strip() or "Cool-Down",
                steps=cool_steps,
                section_distance_m=sum(s.step_distance_m for s in cool_steps),
            ),
        )
    except ValidationError as exc:
        raise ValidationIssue(f"step/section normalization failed: {exc}") from exc

    total = (
        sections.warm_up.section_distance_m
        + sections.main_set.section_distance_m
        + sections.cool_down.section_distance_m
    )

    if draft.plan_id is not None:
        plan_id = draft.plan_id
    elif seed is not None:
        plan_id = _deterministic_plan_id(request, seed)
    else:
        plan_id = uuid4()

    if draft.created_at is not None:
        created_at = draft.created_at.astimezone(timezone.utc)
    elif seed is not None:
        created_at = _deterministic_created_at(seed)
    else:
        created_at = datetime.now(timezone.utc)

    duration_minutes = draft.duration_minutes or request.duration_minutes

    try:
        return SwimPlanResponse(
            plan_id=plan_id,
            created_at=created_at,
            duration_minutes=duration_minutes,
            estimated_distance_m=total,
            sections=sections,
        )
    except ValidationError as exc:
        raise ValidationIssue(f"response normalization failed: {exc}") from exc
