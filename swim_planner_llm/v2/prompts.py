from __future__ import annotations

import json

from swim_planner_llm.llm_client import (
    _distance_guidance,
    _schema_excerpt,
    _section_proportion_guidance,
    _swim_level_hint,
)
from swim_planner_llm.models import SwimPlanInput

from .types import GenerationSpecV2


def build_system_prompt_v2() -> str:
    return (
        "You design fun-first swimming sessions for recreational swimmers. "
        "Your sessions feel readable, intentional, and satisfying to complete. "
        "This is not a performance training plan: avoid test-like language by default. "
        "Follow the selected session archetype as a mandatory structure. "
        "Return valid JSON matching the provided schema exactly. "
        "Do not include markdown, comments, explanations, or extra keys."
    )


def _blueprint_block(spec: GenerationSpecV2) -> str:
    def _fmt_section(name: str, steps: int, allowed: tuple[frozenset[str], ...]) -> str:
        parts: list[str] = [f"- {name}: exactly {steps} steps"]
        for idx, kinds in enumerate(allowed, start=1):
            parts.append(f"  - step {idx} allowed kinds: {sorted(kinds)}")
        return "\n".join(parts)

    warm = _fmt_section(
        "warm_up",
        spec.blueprint.warm_up.steps,
        spec.blueprint.warm_up.allowed_kinds_by_step,
    )
    main = _fmt_section(
        "main_set",
        spec.blueprint.main_set.steps,
        spec.blueprint.main_set.allowed_kinds_by_step,
    )
    cool = _fmt_section(
        "cool_down",
        spec.blueprint.cool_down.steps,
        spec.blueprint.cool_down.allowed_kinds_by_step,
    )
    return "\n".join([warm, main, cool])


def _tag_modifier_hints(tags: list[str], archetype_name: str, swim_level: str | None) -> str:
    requested = set(tags)
    hints: list[str] = []

    if "freestyle" in requested:
        hints.append("Make freestyle the default stroke unless a tag requires otherwise.")
    if "mixed" in requested and archetype_name != "Stroke-Switch Ladder":
        hints.append("Include at least two different strokes across the main_set steps (keep it simple).")
    if "butterfly" in requested:
        hints.append("Include butterfly briefly (short reps only), and keep cues simple and relaxed.")
    if "kick" in requested:
        hints.append("Include one kick-focused step (describe it clearly; keep it low-fuss).")

    if {"fins", "pull", "paddles"} & requested:
        hints.append("Use only the requested equipment flags; never add gear that wasn't requested.")

    if "broken" in requested:
        hints.append("If you include a broken step, keep it simple and explain the pause clearly.")
    if "fartlek" in requested:
        hints.append("If you include a fartlek step, describe the surge pattern plainly.")
    if "golf" in requested:
        hints.append("If you include a GOLF step, explain the scoring briefly (strokes + seconds).")
    if "time_trial" in requested:
        hints.append("If you include a time_trial step, keep it controlled and non-maximal unless explicitly asked.")

    if "hypoxic" in requested and swim_level == "advanced":
        hints.append("If you include hypoxic, be conservative and make the breathing pattern crystal clear.")

    if "underwater" in requested and swim_level == "advanced":
        hints.append("If you include underwater, keep reps short and include generous rest.")

    if "fun" in requested:
        hints.append("Keep tone warm and motivating; fun comes from a clear shape, not extra gimmicks.")

    return " ".join(hints) if hints else "No special tag modifiers required beyond compatibility."


def build_user_prompt_v2(
    payload: SwimPlanInput,
    history_summary: str,
    spec: GenerationSpecV2,
) -> str:
    req = payload.session_requested
    requested_tags = list(spec.requested_tags)
    swim_level = req.swim_level

    schema_excerpt = _schema_excerpt()
    distance_guidance = _distance_guidance(req.duration_minutes, req.effort)
    section_proportions = _section_proportion_guidance(req.effort, req.duration_minutes)

    archetype = spec.archetype
    archetype_contract = (
        f"Selected archetype: {archetype.display_name}\n"
        f"- main_set steps must be {archetype.min_main_steps}-{archetype.max_main_steps}\n"
        f"- allowed main_set kinds: {sorted(archetype.allowed_main_kinds)}\n"
        f"- one main idea only: do not add extra mechanics outside this archetype\n"
    )

    swim_level_block = (
        f"SWIM LEVEL:\n"
        f"The swimmer's level is '{swim_level}'.\n"
        f"{_swim_level_hint(swim_level)}\n\n"
        if swim_level
        else ""
    )

    tag_hints = _tag_modifier_hints(requested_tags, archetype.display_name, swim_level)

    return (
        "Generate a personalised swim session plan.\n\n"
        "DECISION PRIORITY (follow in this order):\n"
        "1. Return valid JSON matching the schema exactly.\n"
        "2. Follow the selected archetype contract (mandatory structure).\n"
        "3. Follow the locked blueprint (exact step counts + allowed kinds).\n"
        "4. Match requested duration_minutes and effort.\n"
        "5. Apply tags as modifiers only (do not change the session shape).\n"
        "6. Use history to avoid disliked mechanics and repetition.\n\n"
        "REQUEST:\n"
        f"{json.dumps(req.model_dump(), sort_keys=True)}\n\n"
        f"{swim_level_block}"
        "REQUESTED TAGS (modifiers only):\n"
        f"{json.dumps(requested_tags)}\n"
        f"{tag_hints}\n\n"
        "HISTORIC GUIDANCE:\n"
        f"{history_summary}\n\n"
        "ARCHETYPE CONTRACT (MANDATORY):\n"
        f"{archetype_contract}\n"
        "LOCKED BLUEPRINT (DO NOT CHANGE STEP COUNTS):\n"
        f"{_blueprint_block(spec)}\n\n"
        "EFFORT EXPRESSION:\n"
        "- easy: smooth, comfortable; longer repeats or easier rest.\n"
        "- medium: steady, repeatable; moderate rest.\n"
        "- hard: quality-focused; shorter reps and/or adequate rest; include warm-up activation.\n\n"
        "STYLE / READABILITY RULES:\n"
        "- Step descriptions must be one brief sentence with one key cue.\n"
        "- Use plain, everyday language.\n"
        "- Do not write test-like or race-like instructions unless explicitly requested.\n"
        "- Do not reference metres, distances, or rep lengths in descriptions; cue effort and feel instead.\n\n"
        "DISTANCE GUIDANCE:\n"
        f"{distance_guidance}\n\n"
        "SECTION PROPORTIONS:\n"
        f"{section_proportions}\n\n"
        "HARD CONSTRAINTS:\n"
        "- Return exactly ONE JSON object.\n"
        "- Do not include markdown.\n"
        "- Do not include comments.\n"
        "- Do not include explanations.\n"
        "- Do not include extra keys.\n"
        "- Include sections.warm_up, sections.main_set, sections.cool_down.\n"
        "- Every section must include title, section_distance_m, and steps.\n"
        "- Every step must include all required fields.\n"
        "- Sum of all step distances must equal section_distance_m.\n"
        "- Sum of all sections must equal estimated_distance_m.\n"
        "- All distances must be exact multiples of 50 (50, 100, 150, ...): distance_per_rep_m, section_distance_m, estimated_distance_m, and pyramid_sequence_m values.\n"
        "- Minimum distance_per_rep_m is 50m. Never use 25m or any non-multiple of 50.\n"
        "- reps must be > 0.\n"
        "- kind: 'intervals' must have reps >= 2. If reps == 1, use kind: 'continuous' (or 'build' / 'negative_split' / 'fartlek' / 'time_trial' when appropriate).\n"
        "- Use either rest_seconds or sendoff_seconds on a step, not both. Set the unused one to null.\n"
        "- rest_seconds must be null or >= 0.\n"
        "- sendoff_seconds must be null or >= 1.\n"
        "- Allowed kind values: continuous, intervals, pyramid, descending, ascending, build, negative_split, broken, fartlek, time_trial.\n"
        "- broken: must have broken_pause_s >= 5; description must mention pausing at the halfway wall.\n"
        "- fartlek: reps must be 1; description must describe the surge pattern clearly.\n"
        "- time_trial: reps must be 1; do not set rest_seconds or sendoff_seconds.\n"
        "- When kind is pyramid/descending/ascending: pyramid_sequence_m is required; reps must equal pyramid_sequence_m length.\n"
        "- hypoxic: true only permitted in main_set; requires rest_seconds >= 20.\n"
        "- underwater: true only permitted in main_set; requires rest_seconds >= 30; never use sendoff_seconds on underwater steps.\n"
        "- fins: true may only be set when 'fins' is in requested_tags.\n"
        "- pull: true may only be set when 'pull' is in requested_tags.\n"
        "- paddles: true may only be set when 'paddles' is in requested_tags.\n\n"
        "OUTPUT SHAPE EXAMPLE:\n"
        f"{schema_excerpt}\n\n"
        "Return the final JSON object only."
    )


def build_repair_prompt_v2(
    original_text: str,
    error_text: str,
    spec: GenerationSpecV2,
) -> str:
    archetype = spec.archetype
    return (
        "Your previous response was invalid.\n\n"
        "TASK:\n"
        "Return a corrected version of the JSON only.\n"
        "Do not explain the error.\n"
        "Do not include markdown.\n"
        "Do not include any text before or after the JSON.\n\n"
        "IMPORTANT:\n"
        f"- Selected archetype is mandatory: {archetype.display_name}\n"
        f"- main_set steps must be {archetype.min_main_steps}-{archetype.max_main_steps}\n"
        f"- allowed main_set kinds: {sorted(archetype.allowed_main_kinds)}\n"
        "- Follow the locked blueprint exactly (do not change step counts).\n"
        f"{_blueprint_block(spec)}\n\n"
        "VALIDATION ERROR:\n"
        f"{error_text}\n\n"
        "PREVIOUS OUTPUT:\n"
        f"{original_text}\n\n"
        "Return one corrected JSON object only."
    )
