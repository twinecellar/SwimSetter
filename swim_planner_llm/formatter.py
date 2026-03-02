from __future__ import annotations

from .models import Step, SwimPlanResponse


def _description_title(description: str) -> str:
    for sep in (":", "."):
        idx = description.find(sep)
        if idx > 0:
            return description[:idx].strip()
    return description.strip()


_PYRAMID_KINDS = frozenset({"pyramid", "descending", "ascending"})


def _format_timing(step: Step) -> str:
    if step.sendoff_sequence_s:
        parts = [f"{v // 60}:{v % 60:02d}" for v in step.sendoff_sequence_s]
        return f" @ [{'-'.join(parts)}]"
    if step.rest_sequence_s:
        return f" @ [{'-'.join(str(v) for v in step.rest_sequence_s)}]s rest"
    if step.sendoff_seconds is not None:
        mins = step.sendoff_seconds // 60
        secs = step.sendoff_seconds % 60
        return f" @ {mins}:{secs:02d}"
    if step.rest_seconds is not None:
        return f" @ {step.rest_seconds}s rest"
    return ""


def _line_for_step(step: Step, show_title: bool = False) -> str:
    timing = _format_timing(step)
    if step.kind == "continuous":
        line = f"{step.step_distance_m}m {step.stroke} {step.effort}"
    elif step.kind == "build":
        if step.reps > 1:
            line = f"{step.reps} x {step.distance_per_rep_m}m build {step.stroke} {step.effort}{timing}"
        else:
            line = f"{step.distance_per_rep_m}m build {step.stroke} {step.effort}"
    elif step.kind == "negative_split":
        if step.reps > 1:
            line = f"{step.reps} x {step.distance_per_rep_m}m negative split {step.stroke} {step.effort}{timing}"
        else:
            line = f"{step.distance_per_rep_m}m negative split {step.stroke} {step.effort}"
    elif step.kind in _PYRAMID_KINDS and step.pyramid_sequence_m:
        seq = "-".join(str(d) for d in step.pyramid_sequence_m)
        line = f"{step.kind} [{seq}]m {step.stroke} {step.effort}{timing}"
    elif step.kind == "broken":
        pause = f"{step.broken_pause_s}s pause" if step.broken_pause_s else "pause"
        if step.reps == 1:
            line = f"{step.distance_per_rep_m}m broken ({pause}) {step.stroke} {step.effort}{timing}"
        else:
            line = f"{step.reps} x {step.distance_per_rep_m}m broken ({pause}) {step.stroke} {step.effort}{timing}"
    elif step.kind == "fartlek":
        line = f"{step.distance_per_rep_m}m fartlek {step.stroke} {step.effort}"
    elif step.kind == "time_trial":
        if step.target_time_s:
            mins = step.target_time_s // 60
            secs = step.target_time_s % 60
            line = f"{step.distance_per_rep_m}m time trial {step.stroke} (target {mins}:{secs:02d})"
        else:
            line = f"{step.distance_per_rep_m}m time trial {step.stroke}"
    else:
        line = f"{step.reps} x {step.distance_per_rep_m}m {step.stroke} {step.effort}{timing}"

    badges = [b for b in ("pull" if step.pull else None, "paddles" if step.paddles else None, "fins" if step.fins else None, "underwater" if step.underwater else None) if b]
    if badges:
        line = f"{line} [{', '.join(badges)}]"

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
