from __future__ import annotations

from swim_planner_llm.models import StepKind, SwimPlanInput

from .types import ArchetypeContract, BlueprintV2, SectionBlueprint


def _sb(steps: int, *allowed: frozenset[StepKind]) -> SectionBlueprint:
    if len(allowed) != steps:
        raise ValueError("allowed kinds must be provided for each step position")
    return SectionBlueprint(steps=steps, allowed_kinds_by_step=tuple(allowed))


def _same(steps: int, allowed: frozenset[StepKind]) -> tuple[frozenset[StepKind], ...]:
    return tuple(allowed for _ in range(steps))


def build_blueprint_v2(archetype: ArchetypeContract, payload: SwimPlanInput) -> BlueprintV2:
    effort = payload.session_requested.effort
    duration = payload.session_requested.duration_minutes
    level = payload.session_requested.swim_level

    # Warm-up / cool-down are intentionally stable for readability.
    if effort == "hard":
        warm = _sb(2, frozenset({"continuous"}), frozenset({"intervals"}))
    else:
        warm = _sb(1, frozenset({"continuous"}))
    cool = _sb(1, frozenset({"continuous"}))

    archetype_id = archetype.archetype_id

    if archetype_id == "flow_reset":
        main_steps = 2 if effort == "hard" and duration >= 25 else 1
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "cruise_builder":
        main_steps = 2 if duration >= 35 else 1
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "playful_alternator":
        main_steps = 2 if duration >= 30 else 1
        # Step 1 is the alternation block, step 2 (if any) is an easy continuous reset.
        if main_steps == 1:
            main = _sb(1, frozenset({"intervals"}))
        else:
            main = _sb(2, frozenset({"intervals"}), frozenset({"continuous"}))
    elif archetype_id == "mini_block_roulette":
        main_steps = 4 if duration >= 35 else 3
        if level == "beginner":
            main_steps = 3
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "stroke_switch_ladder":
        main_steps = 2 if duration >= 35 else 1
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "punchy_pops":
        main_steps = 2 if duration >= 30 else 1
        if level == "beginner":
            main_steps = 1
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "gear_change_up":
        main = _sb(2, *_same(2, archetype.allowed_main_kinds))
    elif archetype_id == "technique_refresh":
        main_steps = 2
        if level == "advanced" and duration >= 35:
            main_steps = 3
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "choice_session":
        main_steps = 2 if duration < 35 else 3
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    elif archetype_id == "benchmark_lite":
        main_steps = 2 if duration < 35 else 3
        main = _sb(main_steps, *_same(main_steps, archetype.allowed_main_kinds))
    else:
        main = _sb(archetype.min_main_steps, *_same(archetype.min_main_steps, archetype.allowed_main_kinds))

    return BlueprintV2(warm_up=warm, main_set=main, cool_down=cool)
