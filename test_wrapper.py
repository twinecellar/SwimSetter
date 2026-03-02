#!/usr/bin/env python3

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional

from swim_planner_llm import generate_swim_plan, plan_to_canonical_text
from swim_planner_llm.models import SwimPlanInput, SwimPlanResponse
from swim_planner_llm.style_inference import infer_prefer_varied_from_payload
from swim_planner_llm.v2.router import build_generation_spec_v2


DEFAULT_SYNTHETIC_PAYLOAD = {
    "session_requested": {
        "duration_minutes": 20,
        "effort": "easy",
        "requested_tags": ["fun", "fins"],
        "swim_level": "advanced",
    },
    "historic_sessions": [],
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
        step_sum = sum(s.step_distance_m for s in section.steps)
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
    *,
    version: str,
    seed: int = 42,
) -> tuple[Optional[SwimPlanResponse], float]:
    label = f"{provider.upper()} {version.upper()}"
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}")
    try:
        t0 = time.perf_counter()
        plan = generate_swim_plan(payload, seed=seed, provider=provider, version=version)
        elapsed = time.perf_counter() - t0
        if version == "v1":
            _assert_plan_valid(plan, prefer_varied)
        else:
            assert "—" in (plan.sections.main_set.title or "")
        print(f"  distance : {plan.estimated_distance_m}m")
        print(f"  duration : {plan.duration_minutes} min")
        print(f"  main steps: {len(plan.sections.main_set.steps)}")
        print(f"  main title: {plan.sections.main_set.title}")
        print(f"  time     : {elapsed:.2f}s")
        print()
        print(plan_to_canonical_text(plan))
        return plan, elapsed
    except Exception as exc:
        print(f"  ERROR: {exc}")
        return None, 0.0


def _compare(
    v1_plan: Optional[SwimPlanResponse],
    v2_plan: Optional[SwimPlanResponse],
    v1_elapsed: float,
    v2_elapsed: float,
) -> None:
    print(f"\n{'=' * 60}")
    print("  COMPARISON")
    print(f"{'=' * 60}")

    if v1_plan is None or v2_plan is None:
        print("  Cannot compare — v1 or v2 failed.")
        return

    distance_match = v1_plan.estimated_distance_m == v2_plan.estimated_distance_m
    main_steps_match = len(v1_plan.sections.main_set.steps) == len(v2_plan.sections.main_set.steps)
    faster = "v1" if v1_elapsed < v2_elapsed else "v2"
    time_diff = abs(v1_elapsed - v2_elapsed)

    print(f"  v1 distance : {v1_plan.estimated_distance_m}m")
    print(f"  v2 distance : {v2_plan.estimated_distance_m}m")
    print(f"  Distance match   : {'yes' if distance_match else 'no'}")
    print()
    print(f"  v1 main steps : {len(v1_plan.sections.main_set.steps)}")
    print(f"  v2 main steps : {len(v2_plan.sections.main_set.steps)}")
    print(f"  Main step count match : {'yes' if main_steps_match else 'no'}")
    print()
    print(f"  v1 main title : {v1_plan.sections.main_set.title}")
    print(f"  v2 main title : {v2_plan.sections.main_set.title}")
    print()
    print(f"  v1 time : {v1_elapsed:.2f}s")
    print(f"  v2 time : {v2_elapsed:.2f}s")
    print(f"  Faster  : {faster} by {time_diff:.2f}s")


def main() -> None:
    payload = _load_payload()
    parsed_payload = SwimPlanInput.model_validate(payload)
    prefer_varied = infer_prefer_varied_from_payload(parsed_payload)
    v2_spec = build_generation_spec_v2(parsed_payload)

    print(f"\nInput  : {payload['session_requested']}")
    print(f"Style  : {'varied' if prefer_varied else 'straightforward'}")
    print(f"v2 pick : {v2_spec.archetype.display_name}")

    v1_plan, v1_elapsed = _run_provider("claude", payload, prefer_varied, version="v1")
    v2_plan, v2_elapsed = _run_provider("claude", payload, prefer_varied, version="v2")

    _compare(v1_plan, v2_plan, v1_elapsed, v2_elapsed)


if __name__ == "__main__":
    main()
