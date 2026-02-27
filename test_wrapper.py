from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional

from swim_planner_llm import generate_swim_plan, plan_to_canonical_text
from swim_planner_llm.models import SwimPlanInput, SwimPlanResponse
from swim_planner_llm.style_inference import infer_prefer_varied_from_payload


DEFAULT_SYNTHETIC_PAYLOAD = {
    "session_requested": {
        "duration_minutes": 20,
        "effort": "medium",
        "requested_tags": ["straightforward"],
    },
    "historic_sessions": [
        {
            "session_plan": {
                "duration_minutes": 20,
                "estimated_distance_m": 700,
            },
            "thumb": 1,
            "tags": ["fun", "good-pace"],
        },
        {
            "session_plan": {
                "duration_minutes": 20,
                "estimated_distance_m": 750,
            },
            "thumb": 1,
            "tags": ["solid", "short-rest"],
        },
        {
            "session_plan": {
                "duration_minutes": 20,
                "estimated_distance_m": 900,
            },
            "thumb": 0,
            "tags": ["pace-too-fast", "long", "tiring"],
        },
    ],
}


def _load_payload() -> dict:
    file_path = Path("synthetic_payload.json")
    if file_path.exists():
        return json.loads(file_path.read_text(encoding="utf-8"))
    return DEFAULT_SYNTHETIC_PAYLOAD


def _pattern_count_for_main_set(plan: SwimPlanResponse) -> int:
    signatures = {
        (
            step.kind,
            step.distance_per_rep_m,
            step.stroke,
            step.rest_seconds,
            step.effort,
        )
        for step in plan.sections.main_set.steps
    }
    return len(signatures)


def _assert_plan_valid(plan: SwimPlanResponse, prefer_varied: bool) -> None:
    assert plan.sections.warm_up is not None
    assert plan.sections.main_set is not None
    assert plan.sections.cool_down is not None

    for section in [plan.sections.warm_up, plan.sections.main_set, plan.sections.cool_down]:
        step_sum = sum(s.reps * s.distance_per_rep_m for s in section.steps)
        assert step_sum == section.section_distance_m

    section_total = (
        plan.sections.warm_up.section_distance_m
        + plan.sections.main_set.section_distance_m
        + plan.sections.cool_down.section_distance_m
    )
    assert section_total == plan.estimated_distance_m

    if not prefer_varied:
        assert _pattern_count_for_main_set(plan) <= 1
    else:
        assert len(plan.sections.main_set.steps) >= 2

    for section in [plan.sections.warm_up, plan.sections.main_set, plan.sections.cool_down]:
        for step in section.steps:
            assert step.reps > 0
            assert step.distance_per_rep_m > 0


def _run_provider(
    provider: str,
    payload: dict,
    prefer_varied: bool,
    seed: int = 42,
) -> tuple[Optional[SwimPlanResponse], float]:
    label = provider.upper()
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}")
    try:
        t0 = time.perf_counter()
        plan = generate_swim_plan(payload, seed=seed, provider=provider)
        elapsed = time.perf_counter() - t0
        _assert_plan_valid(plan, prefer_varied)
        print(f"  distance : {plan.estimated_distance_m}m")
        print(f"  duration : {plan.duration_minutes} min")
        print(f"  main steps: {len(plan.sections.main_set.steps)}")
        print(f"  time     : {elapsed:.2f}s")
        print()
        print(plan_to_canonical_text(plan))
        return plan, elapsed
    except Exception as exc:
        print(f"  ERROR: {exc}")
        return None, 0.0


def _compare(
    openai_plan: Optional[SwimPlanResponse],
    claude_plan: Optional[SwimPlanResponse],
    openai_elapsed: float,
    claude_elapsed: float,
) -> None:
    print(f"\n{'=' * 60}")
    print("  COMPARISON")
    print(f"{'=' * 60}")

    if openai_plan is None or claude_plan is None:
        print("  Cannot compare — one or both providers failed.")
        return

    distance_match = openai_plan.estimated_distance_m == claude_plan.estimated_distance_m
    main_steps_match = len(openai_plan.sections.main_set.steps) == len(claude_plan.sections.main_set.steps)
    faster = "OpenAI" if openai_elapsed < claude_elapsed else "Claude"
    time_diff = abs(openai_elapsed - claude_elapsed)

    print(f"  OpenAI  distance : {openai_plan.estimated_distance_m}m")
    print(f"  Claude  distance : {claude_plan.estimated_distance_m}m")
    print(f"  Distance match   : {'yes' if distance_match else 'no'}")
    print()
    print(f"  OpenAI  main steps : {len(openai_plan.sections.main_set.steps)}")
    print(f"  Claude  main steps : {len(claude_plan.sections.main_set.steps)}")
    print(f"  Main step count match : {'yes' if main_steps_match else 'no'}")
    print()
    print(f"  OpenAI  time : {openai_elapsed:.2f}s")
    print(f"  Claude  time : {claude_elapsed:.2f}s")
    print(f"  Faster       : {faster} by {time_diff:.2f}s")


def main() -> None:
    payload = _load_payload()
    parsed_payload = SwimPlanInput.model_validate(payload)
    prefer_varied = infer_prefer_varied_from_payload(parsed_payload)

    print(f"\nInput  : {payload['session_requested']}")
    print(f"Style  : {'varied' if prefer_varied else 'straightforward'}")

    openai_plan, openai_elapsed = _run_provider("openai", payload, prefer_varied)
    claude_plan, claude_elapsed = _run_provider("claude", payload, prefer_varied)

    _compare(openai_plan, claude_plan, openai_elapsed, claude_elapsed)


if __name__ == "__main__":
    main()
