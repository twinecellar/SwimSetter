from __future__ import annotations

import json
from pathlib import Path

from swim_planner_llm import generate_swim_plan, plan_to_canonical_text
from swim_planner_llm.models import SwimPlanInput
from swim_planner_llm.style_inference import infer_prefer_varied_from_payload


DEFAULT_SYNTHETIC_PAYLOAD = {
    "session_requested": {
        "duration_minutes": 25,
        "effort": "hard",
        "requested_tags": ["speed", "technique", "endurance"],
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


def _pattern_count_for_main_set(plan) -> int:
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


def main() -> None:
    payload = _load_payload()
    plan = generate_swim_plan(payload, seed=42)
    parsed_payload = SwimPlanInput.model_validate(payload)
    prefer_varied = infer_prefer_varied_from_payload(parsed_payload)

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

    print(plan_to_canonical_text(plan))


if __name__ == "__main__":
    main()
