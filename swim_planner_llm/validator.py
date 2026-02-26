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


ALLOWED_STEP_KINDS = {"continuous", "intervals"}
ALLOWED_STROKES = {
    "freestyle",
    "backstroke",
    "breaststroke",
    "butterfly",
    "mixed",
    "choice",
}
ALLOWED_EFFORTS = {"easy", "medium", "hard"}


def _step_signature(step: Step) -> tuple:
    """
    Pattern signature used to determine whether main_set contains
    more than one distinct structural pattern.
    """
    return (
        step.kind,
        step.reps,
        step.distance_per_rep_m,
        step.stroke,
        step.rest_seconds,
        step.effort,
    )


def _has_sensitive_down_feedback(historic_sessions: list[HistoricSession]) -> bool:
    risk_tags = {"pace-too-fast", "long", "tiring"}
    for session in historic_sessions:
        if session.thumb != 0:
            continue
        lowered = {tag.strip().lower() for tag in session.tags if tag and tag.strip()}
        if lowered.intersection(risk_tags):
            return True
    return False


def _validate_step_fields(step: Step, section_name: str) -> None:
    if step.kind not in ALLOWED_STEP_KINDS:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: invalid kind '{step.kind}'"
        )

    if step.stroke not in ALLOWED_STROKES:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: invalid stroke '{step.stroke}'"
        )

    if step.effort not in ALLOWED_EFFORTS:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: invalid effort '{step.effort}'"
        )

    if step.reps <= 0:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: reps must be > 0"
        )

    if step.distance_per_rep_m <= 0:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: distance_per_rep_m must be > 0"
        )

    if step.distance_per_rep_m % 50 != 0:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: distance_per_rep_m must be divisible by 50"
        )

    if step.step_distance_m <= 0:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: computed step distance must be > 0"
        )

    if step.step_distance_m % 50 != 0:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: computed step distance must be divisible by 50"
        )

    if step.rest_seconds is not None and step.rest_seconds < 0:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: rest_seconds must be >= 0 or null"
        )

    if not step.step_id.strip():
        raise ValidationIssue(
            f"{section_name}: step_id must not be empty"
        )

    if not step.description.strip():
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: description must not be empty"
        )


def _validate_section(section: Section, section_name: str) -> int:
    if not section.title.strip():
        raise ValidationIssue(f"{section_name}: title must not be empty")

    if not section.steps:
        raise ValidationIssue(f"{section_name}: must contain at least one step")

    step_sum = 0
    for step in section.steps:
        _validate_step_fields(step, section_name)
        step_sum += step.step_distance_m

    if section.section_distance_m <= 0:
        raise ValidationIssue(f"{section_name}: section_distance_m must be > 0")

    if section.section_distance_m % 50 != 0:
        raise ValidationIssue(
            f"{section_name}: section_distance_m must be divisible by 50"
        )

    if step_sum != section.section_distance_m:
        raise ValidationIssue(
            f"{section_name}: section_distance_m does not match step sum"
        )

    return step_sum


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
    warm_sum = _validate_section(plan.sections.warm_up, "warm_up")
    main_sum = _validate_section(plan.sections.main_set, "main_set")
    cool_sum = _validate_section(plan.sections.cool_down, "cool_down")

    total = warm_sum + main_sum + cool_sum
    if total != plan.estimated_distance_m:
        raise ValidationIssue(
            "estimated_distance_m does not match total section distances"
        )

    if plan.estimated_distance_m <= 0:
        raise ValidationIssue("estimated_distance_m must be > 0")

    if plan.estimated_distance_m % 50 != 0:
        raise ValidationIssue("estimated_distance_m must be divisible by 50")

    if plan.duration_minutes <= 0:
        raise ValidationIssue("duration_minutes must be > 0")

    # Keep contract aligned to the user request.
    if plan.duration_minutes != request.duration_minutes:
        raise ValidationIssue(
            "duration_minutes must match requested duration_minutes"
        )

    if request.fun_mode == "straightforward":
        signatures = {_step_signature(step) for step in plan.sections.main_set.steps}
        if len(signatures) > 1:
            raise ValidationIssue(
                "straightforward mode requires one main_set pattern signature"
            )

    if request.fun_mode == "varied":
        # Soft-ish product rule turned into validation:
        # if varied mode has only one main step, it is usually under-delivering.
        if len(plan.sections.main_set.steps) < 2:
            raise ValidationIssue(
                "varied mode should usually include at least 2 main_set steps"
            )

    if _has_sensitive_down_feedback(historic_sessions):
        for step in plan.sections.main_set.steps:
            if (
                step.kind == "continuous"
                and step.effort == "hard"
                and step.step_distance_m > 500
            ):
                raise ValidationIssue(
                    "main_set contains long hard continuous block despite sensitive thumbs-down history"
                )


def _deterministic_plan_id(request: SessionRequested, seed: int) -> UUID:
    return uuid5(
        UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
        f"{request.model_dump_json()}|{seed}",
    )


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

    if not out:
        raise ValidationIssue(f"{prefix}: no steps provided")

    return out


def enforce_and_normalize(
    draft: LLMPlanDraft,
    request: SessionRequested,
    seed: Optional[int],
) -> SwimPlanResponse:
    try:
        warm_steps = _convert_steps(
            draft.sections.warm_up.steps,
            "wu",
            "Auto-generated warm-up step",
        )
        main_steps = _convert_steps(
            draft.sections.main_set.steps,
            "main",
            "Auto-generated main step",
        )
        cool_steps = _convert_steps(
            draft.sections.cool_down.steps,
            "cd",
            "Auto-generated cool-down step",
        )

        sections = Sections(
            warm_up=Section(
                title=(draft.sections.warm_up.title or "").strip() or "Warm-Up",
                steps=warm_steps,
                section_distance_m=sum(s.step_distance_m for s in warm_steps),
            ),
            main_set=Section(
                title=(draft.sections.main_set.title or "").strip() or "Main Set",
                steps=main_steps,
                section_distance_m=sum(s.step_distance_m for s in main_steps),
            ),
            cool_down=Section(
                title=(draft.sections.cool_down.title or "").strip() or "Cool-Down",
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

    # Keep duration stable and application-owned.
    duration_minutes = request.duration_minutes

    try:
        plan = SwimPlanResponse(
            plan_id=plan_id,
            created_at=created_at,
            duration_minutes=duration_minutes,
            estimated_distance_m=total,
            sections=sections,
        )
    except ValidationError as exc:
        raise ValidationIssue(f"response normalization failed: {exc}") from exc

    return plan