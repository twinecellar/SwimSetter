from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4, uuid5

from pydantic import ValidationError

from .models import (
    PYRAMID_KINDS,
    HistoricSession,
    LLMPlanDraft,
    Section,
    Sections,
    SessionRequested,
    Step,
    SwimPlanResponse,
)
from .style_inference import infer_prefer_varied
from .v2.types import GenerationSpecV2


class ValidationIssue(ValueError):
    pass


ALLOWED_STEP_KINDS = {
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
}
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

    if step.kind == "intervals" and step.reps == 1:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: intervals steps must have reps >= 2 (use kind 'continuous' for a single rep)"
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

    if step.kind in PYRAMID_KINDS:
        seq = step.pyramid_sequence_m
        if not seq:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: pyramid_sequence_m is required for kind '{step.kind}'"
            )
        if step.reps != len(seq):
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: reps must equal pyramid_sequence_m length"
            )
        for d in seq:
            if d < 50 or d % 50 != 0:
                raise ValidationIssue(
                    f"{section_name}.{step.step_id}: every pyramid_sequence_m value must be a multiple of 50 and >= 50"
                )
    else:
        if step.distance_per_rep_m <= 0:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: distance_per_rep_m must be > 0"
            )
        if step.distance_per_rep_m % 50 != 0:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: distance_per_rep_m must be divisible by 50"
            )

    if step.rest_sequence_s is not None:
        if step.kind not in PYRAMID_KINDS:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: rest_sequence_s is only valid for pyramid/descending/ascending kinds"
            )
        if step.pyramid_sequence_m and len(step.rest_sequence_s) != len(step.pyramid_sequence_m):
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: rest_sequence_s length must match pyramid_sequence_m"
            )
        for v in step.rest_sequence_s:
            if v < 0:
                raise ValidationIssue(
                    f"{section_name}.{step.step_id}: rest_sequence_s values must be >= 0"
                )
        if step.rest_seconds is not None:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: rest_sequence_s and rest_seconds are mutually exclusive"
            )
        if step.sendoff_seconds is not None:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: rest_sequence_s and sendoff_seconds are mutually exclusive"
            )

    if step.sendoff_sequence_s is not None:
        if step.kind not in PYRAMID_KINDS:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: sendoff_sequence_s is only valid for pyramid/descending/ascending kinds"
            )
        if step.pyramid_sequence_m and len(step.sendoff_sequence_s) != len(step.pyramid_sequence_m):
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: sendoff_sequence_s length must match pyramid_sequence_m"
            )
        for v in step.sendoff_sequence_s:
            if v < 1:
                raise ValidationIssue(
                    f"{section_name}.{step.step_id}: sendoff_sequence_s values must be >= 1"
                )
        if step.sendoff_seconds is not None:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: sendoff_sequence_s and sendoff_seconds are mutually exclusive"
            )
        if step.rest_sequence_s is not None:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: rest_sequence_s and sendoff_sequence_s are mutually exclusive"
            )

    if step.hypoxic is True and section_name != "main_set":
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: hypoxic: true is only permitted on main_set steps"
        )

    if step.hypoxic is True and (step.rest_seconds is None or step.rest_seconds < 20):
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: hypoxic steps must have rest_seconds >= 20"
        )

    if step.underwater is True and section_name != "main_set":
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: underwater: true is only permitted on main_set steps"
        )

    if step.underwater is True and step.sendoff_seconds is not None:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: underwater steps must use rest_seconds, not sendoff_seconds"
        )

    if step.underwater is True and (step.rest_seconds is None or step.rest_seconds < 30):
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: underwater steps must have rest_seconds >= 30"
        )

    if step.kind == "broken":
        if step.broken_pause_s is None or step.broken_pause_s < 5:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: broken steps must have broken_pause_s >= 5"
            )

    if step.kind == "build" and step.reps != 1:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: build steps must have reps == 1"
        )

    if step.kind == "negative_split":
        if step.reps != 1:
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: negative_split steps must have reps == 1"
            )
        if not (step.split_instruction or "").strip():
            raise ValidationIssue(
                f"{section_name}.{step.step_id}: negative_split steps must include split_instruction"
            )

    if step.kind == "fartlek" and step.reps != 1:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: fartlek steps must have reps == 1"
        )

    if step.kind == "time_trial" and step.reps != 1:
        raise ValidationIssue(
            f"{section_name}.{step.step_id}: time_trial steps must have reps == 1"
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
    requested_tags: list[str],
    *,
    version: str = "v1",
    v2_spec: GenerationSpecV2 | None = None,
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

    if version == "v1":
        prefer_varied = infer_prefer_varied(
            request.requested_tags + requested_tags,
            historic_sessions,
        )

        if not prefer_varied:
            signatures = {_step_signature(step) for step in plan.sections.main_set.steps}
            if len(signatures) > 1:
                raise ValidationIssue(
                    "straightforward style requires one main_set pattern signature"
                )

        if prefer_varied:
            if len(plan.sections.main_set.steps) < 2:
                raise ValidationIssue(
                    "varied style should include at least 2 main_set steps"
                )
    elif version == "v2":
        if v2_spec is None:
            raise ValidationIssue("v2_spec is required for v2 validation")
        _validate_v2_archetype_contract(plan, request, requested_tags, v2_spec)
    else:
        raise ValidationIssue(f"unknown validation version '{version}'")

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


def _validate_v2_archetype_contract(
    plan: SwimPlanResponse,
    request: SessionRequested,
    requested_tags: list[str],
    spec: GenerationSpecV2,
) -> None:
    tags = {t.strip().lower() for t in (request.requested_tags + requested_tags) if t and t.strip()}
    archetype = spec.archetype

    # Locked blueprint: exact step counts per section.
    if len(plan.sections.warm_up.steps) != spec.blueprint.warm_up.steps:
        raise ValidationIssue("v2 blueprint mismatch: warm_up step count differs")
    if len(plan.sections.main_set.steps) != spec.blueprint.main_set.steps:
        raise ValidationIssue("v2 blueprint mismatch: main_set step count differs")
    if len(plan.sections.cool_down.steps) != spec.blueprint.cool_down.steps:
        raise ValidationIssue("v2 blueprint mismatch: cool_down step count differs")

    # Archetype contract: main_set step count bounds + allowed kinds.
    main_steps = plan.sections.main_set.steps
    if not (archetype.min_main_steps <= len(main_steps) <= archetype.max_main_steps):
        raise ValidationIssue("v2 archetype contract violation: main_set step count out of bounds")

    for idx, step in enumerate(main_steps, start=1):
        if step.kind not in archetype.allowed_main_kinds:
            raise ValidationIssue(
                f"v2 archetype contract violation: main_set step {idx} kind '{step.kind}' not allowed"
            )

    # Per-step allowed kinds from blueprint (positionally).
    for idx, step in enumerate(plan.sections.warm_up.steps, start=1):
        allowed = spec.blueprint.warm_up.allowed_kinds_by_step[idx - 1]
        if step.kind not in allowed:
            raise ValidationIssue(f"v2 blueprint violation: warm_up step {idx} kind '{step.kind}' not allowed")

    for idx, step in enumerate(plan.sections.main_set.steps, start=1):
        allowed = spec.blueprint.main_set.allowed_kinds_by_step[idx - 1]
        if step.kind not in allowed:
            raise ValidationIssue(f"v2 blueprint violation: main_set step {idx} kind '{step.kind}' not allowed")

    for idx, step in enumerate(plan.sections.cool_down.steps, start=1):
        allowed = spec.blueprint.cool_down.allowed_kinds_by_step[idx - 1]
        if step.kind not in allowed:
            raise ValidationIssue(f"v2 blueprint violation: cool_down step {idx} kind '{step.kind}' not allowed")

    # Gear rules: never enable gear unless requested; gear only in main_set for v2.
    requested_gear = {"fins", "pull", "paddles"} & tags
    for section_name, section in (
        ("warm_up", plan.sections.warm_up),
        ("cool_down", plan.sections.cool_down),
    ):
        for step in section.steps:
            if step.fins or step.pull or step.paddles:
                raise ValidationIssue(f"v2 gear rule violation: gear used in {section_name}")

    for step in plan.sections.main_set.steps:
        if step.fins and "fins" not in tags:
            raise ValidationIssue("v2 gear rule violation: fins used without 'fins' tag")
        if step.pull and "pull" not in tags:
            raise ValidationIssue("v2 gear rule violation: pull used without 'pull' tag")
        if step.paddles and "paddles" not in tags:
            raise ValidationIssue("v2 gear rule violation: paddles used without 'paddles' tag")

        gear_count = sum(bool(x) for x in (step.fins, step.pull, step.paddles))
        if gear_count > 1:
            raise ValidationIssue("v2 gear rule violation: multiple gear flags set on one step")

    if archetype.archetype_id == "gear_change_up":
        if not requested_gear:
            raise ValidationIssue("v2 gear_change_up requires an explicit gear tag")
        any_gear = any(bool(s.fins or s.pull or s.paddles) for s in plan.sections.main_set.steps)
        if not any_gear:
            raise ValidationIssue("v2 gear_change_up requires at least one main_set gear step")

    # Safety: hypoxic/underwater only when explicitly requested and archetype allows.
    if any(s.hypoxic is True for s in plan.sections.main_set.steps):
        if "hypoxic" not in tags:
            raise ValidationIssue("v2 safety rule violation: hypoxic used without 'hypoxic' tag")
        if not archetype.allow_hypoxic_if_tagged:
            raise ValidationIssue("v2 safety rule violation: hypoxic not allowed for this archetype")

    if any(s.underwater is True for s in plan.sections.main_set.steps):
        if "underwater" not in tags:
            raise ValidationIssue("v2 safety rule violation: underwater used without 'underwater' tag")
        if not archetype.allow_underwater_if_tagged:
            raise ValidationIssue("v2 safety rule violation: underwater not allowed for this archetype")

    # Archetype-specific rules.
    if archetype.archetype_id == "playful_alternator":
        if plan.sections.main_set.steps[0].kind != "intervals":
            raise ValidationIssue("v2 playful_alternator requires first main_set step kind 'intervals'")
        if len(plan.sections.main_set.steps) == 2:
            step2 = plan.sections.main_set.steps[1]
            if step2.kind != "continuous" or step2.effort != "easy":
                raise ValidationIssue("v2 playful_alternator second step must be an easy continuous reset")

    if archetype.archetype_id == "stroke_switch_ladder":
        has_pyramid_kind = any(s.kind in {"pyramid", "ascending", "descending"} for s in main_steps)
        if not has_pyramid_kind:
            has_mapping = any(
                (s.stroke == "mixed" and ("odd" in s.description.lower() and "even" in s.description.lower()))
                for s in main_steps
            )
            if not has_mapping:
                raise ValidationIssue("v2 stroke_switch_ladder requires a ladder-like step or an odd/even stroke mapping")

    if archetype.archetype_id == "choice_session":
        has_choice = any(s.stroke == "choice" for s in main_steps)
        if not has_choice:
            raise ValidationIssue("v2 choice_session requires at least one main_set step with stroke 'choice'")

    if archetype.archetype_id == "benchmark_lite":
        challenge = 0
        for s in main_steps:
            if s.kind in {"broken", "time_trial"}:
                challenge += 1
            elif "golf" in s.description.lower():
                challenge += 1
        if challenge != 1:
            raise ValidationIssue("v2 benchmark_lite requires exactly one challenge element step")


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
            pyramid_sequence_m=s.pyramid_sequence_m,
            stroke=s.stroke,
            rest_seconds=s.rest_seconds,
            sendoff_seconds=s.sendoff_seconds,
            rest_sequence_s=s.rest_sequence_s,
            sendoff_sequence_s=s.sendoff_sequence_s,
            effort=s.effort,
            description=(s.description or "").strip() or default_description,
            hypoxic=s.hypoxic,
            underwater=s.underwater,
            fins=s.fins,
            pull=s.pull,
            paddles=s.paddles,
            broken_pause_s=s.broken_pause_s,
            target_time_s=s.target_time_s,
            split_instruction=s.split_instruction,
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
