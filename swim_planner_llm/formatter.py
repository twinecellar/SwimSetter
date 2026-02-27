from __future__ import annotations

from .models import Step, SwimPlanResponse


def _description_title(description: str) -> str:
    for sep in (":", "."):
        idx = description.find(sep)
        if idx > 0:
            return description[:idx].strip()
    return description.strip()


def _line_for_step(step: Step, show_title: bool = False) -> str:
    distance = step.reps * step.distance_per_rep_m
    if step.kind == "continuous":
        line = f"{distance}m {step.stroke} {step.effort}"
    else:
        base = f"{step.reps} x {step.distance_per_rep_m}m {step.stroke} {step.effort}"
        line = f"{base} @ {step.rest_seconds}s rest" if step.rest_seconds is not None else base

    if show_title and step.description:
        title = _description_title(step.description)
        if title:
            line = f"{line}. {title}."

    return line


def plan_to_canonical_text(plan: SwimPlanResponse) -> str:
    lines: list[str] = []

    lines.append("WARM-UP")
    for step in plan.sections.warm_up.steps:
        lines.append(_line_for_step(step))

    lines.append("")
    lines.append("MAIN SET")
    for step in plan.sections.main_set.steps:
        lines.append(_line_for_step(step, show_title=True))

    lines.append("")
    lines.append("COOL-DOWN")
    for step in plan.sections.cool_down.steps:
        lines.append(_line_for_step(step))

    return "\n".join(lines)
