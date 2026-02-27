from __future__ import annotations

from .models import Step, SwimPlanResponse


def _line_for_step(step: Step) -> str:
    distance = step.reps * step.distance_per_rep_m
    if step.kind == "continuous":
        return f"{distance}m {step.stroke} {step.effort}"

    base = f"{step.reps} x {step.distance_per_rep_m}m {step.stroke} {step.effort}"
    if step.rest_seconds is None:
        return base
    return f"{base} @ {step.rest_seconds}s rest"


def plan_to_canonical_text(plan: SwimPlanResponse) -> str:
    lines: list[str] = []

    lines.append("WARM-UP")
    for step in plan.sections.warm_up.steps:
        lines.append(_line_for_step(step))

    lines.append("")
    lines.append("MAIN SET")
    for step in plan.sections.main_set.steps:
        lines.append(_line_for_step(step))

    lines.append("")
    lines.append("COOL-DOWN")
    for step in plan.sections.cool_down.steps:
        lines.append(_line_for_step(step))

    return "\n".join(lines)
