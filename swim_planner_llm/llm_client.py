from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from .models import HistoricSession, SwimPlanInput
from .style_inference import infer_prefer_varied_from_payload

SYSTEM_PROMPT = (
    "You are an expert swimming coach with deep knowledge of energy systems, periodization, "
    "and effective swim session design. Your plans follow sound coaching principles: "
    "progressive warm-ups that prime the body for work, main sets matched to the target energy "
    "system, and genuine cool-downs that aid recovery and lactate clearance. "
    "You must return valid JSON matching the provided schema exactly. "
    "Do not include markdown, comments, explanations, or extra keys."
)


def build_system_prompt() -> str:
    return SYSTEM_PROMPT


@lru_cache(maxsize=1)
def _load_dotenv() -> None:
    for env_path in (Path(".env"), Path(".env.local")):
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if not key:
                continue

            if (
                len(value) >= 2
                and (
                    (value[0] == value[-1] == '"')
                    or (value[0] == value[-1] == "'")
                )
            ):
                value = value[1:-1]

            os.environ.setdefault(key, value)


def _schema_excerpt() -> str:
    example = {
        "plan_id": "uuid",
        "created_at": "ISO-8601 datetime",
        "duration_minutes": 20,
        "estimated_distance_m": 700,
        "sections": {
            "warm_up": {
                "title": "Warm-up",
                "section_distance_m": 200,
                "steps": [
                    {
                        "step_id": "wu-1",
                        "kind": "continuous",
                        "reps": 1,
                        "distance_per_rep_m": 200,
                        "stroke": "freestyle",
                        "rest_seconds": None,
                        "effort": "easy",
                        "description": "Easy relaxed warm-up swim.",
                    }
                ],
            },
            "main_set": {
                "title": "Main Set",
                "section_distance_m": 400,
                "steps": [
                    {
                        "step_id": "main-1",
                        "kind": "intervals",
                        "reps": 8,
                        "distance_per_rep_m": 50,
                        "stroke": "freestyle",
                        "rest_seconds": 20,
                        "effort": "hard",
                        "description": "Hold a strong, controlled pace across all repeats.",
                    }
                ],
            },
            "cool_down": {
                "title": "Cool-down",
                "section_distance_m": 100,
                "steps": [
                    {
                        "step_id": "cd-1",
                        "kind": "continuous",
                        "reps": 1,
                        "distance_per_rep_m": 100,
                        "stroke": "choice",
                        "rest_seconds": None,
                        "effort": "easy",
                        "description": "Easy cooldown.",
                    }
                ],
            },
        },
    }
    return json.dumps(example, indent=2)


def _extract_distance(history: HistoricSession) -> Optional[int]:
    plan = history.session_plan or {}
    value = plan.get("estimated_distance_m")
    return value if isinstance(value, int) and value > 0 else None


def _extract_main_set_kinds(history: HistoricSession) -> set[str]:
    steps = (
        (history.session_plan or {})
        .get("sections", {})
        .get("main_set", {})
        .get("steps", [])
    )
    return {s.get("kind") for s in steps if isinstance(s, dict) and s.get("kind")}


def _extract_main_set_strokes(history: HistoricSession) -> set[str]:
    steps = (
        (history.session_plan or {})
        .get("sections", {})
        .get("main_set", {})
        .get("steps", [])
    )
    return {s.get("stroke") for s in steps if isinstance(s, dict) and s.get("stroke")}


def summarize_history(historic_sessions: list[HistoricSession]) -> str:
    up_distances: list[int] = []
    down_distances: list[int] = []
    up_tags: set[str] = set()
    down_tags: set[str] = set()
    disliked_long_hard_continuous = False
    liked_interval_sessions = 0
    liked_continuous_sessions = 0
    liked_stroke_counts: dict[str, int] = {}

    for item in historic_sessions:
        d = _extract_distance(item)
        tags = {t.strip().lower() for t in item.tags if t and t.strip()}
        kinds = _extract_main_set_kinds(item)
        strokes = _extract_main_set_strokes(item)

        if item.thumb == 1:
            if d:
                up_distances.append(d)
            up_tags.update(tags)
            if "intervals" in kinds:
                liked_interval_sessions += 1
            elif "continuous" in kinds:
                liked_continuous_sessions += 1
            for stroke in strokes:
                if stroke not in ("mixed", "choice"):
                    liked_stroke_counts[stroke] = liked_stroke_counts.get(stroke, 0) + 1
        else:
            if d:
                down_distances.append(d)
            down_tags.update(tags)
            if {"pace-too-fast", "long", "tiring"} & tags:
                disliked_long_hard_continuous = True

    def _range(values: list[int]) -> str:
        if not values:
            return "none"
        return f"{min(values)}-{max(values)}m"

    guidance: list[str] = []

    if up_distances:
        guidance.append(f"Prefer volume near {_range(up_distances)}.")
    else:
        guidance.append("No positive volume signal available.")

    if down_distances:
        guidance.append(
            f"Avoid volume near {_range(down_distances)} unless strongly required."
        )

    if up_tags:
        guidance.append(f"Positive themes: {sorted(up_tags)}.")

    if down_tags:
        guidance.append(f"Negative themes: {sorted(down_tags)}.")

    if disliked_long_hard_continuous:
        guidance.append("Avoid long hard continuous main sets; prefer intervals instead.")

    if liked_interval_sessions > liked_continuous_sessions:
        guidance.append("Historic preference: interval-based main sets over continuous.")
    elif liked_continuous_sessions > liked_interval_sessions:
        guidance.append("Historic preference: continuous main sets over intervals.")

    if liked_stroke_counts:
        top_strokes = sorted(
            liked_stroke_counts.keys(),
            key=lambda s: liked_stroke_counts[s],
            reverse=True,
        )[:2]
        guidance.append(f"Preferred strokes in liked sessions: {top_strokes}.")

    return " ".join(guidance)


def _requested_tags(payload: SwimPlanInput) -> list[str]:
    values = payload.session_requested.requested_tags + payload.requested_tags
    deduped: list[str] = []
    seen: set[str] = set()

    for value in values:
        cleaned = value.strip().lower()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        deduped.append(cleaned)

    return deduped


def _requested_tag_hints(requested_tags: list[str]) -> str:
    if not requested_tags:
        return "No requested tags supplied."

    hint_map = {
        "technique": (
            "Build the main_set as a drill circuit with 3-5 distinct drill steps. "
            "Draw from the following drill repertoire — choose whichever complement the "
            "session effort and style: "
            "Kick (hold a float, flutter kick from the hips — tight kick, toes pointed, "
            "knees just below the surface); "
            "Pull (pull buoy between thighs, no kick — focus on high-elbow catch and "
            "full extension on entry); "
            "Fists (swim with clenched fists to engage the forearm and build feel for "
            "the catch, relax on recovery); "
            "Front Scull (arms extended, trace a figure-8 to feel pressure on the palm "
            "and develop water feel); "
            "Mid Scull (elbows bent at 90°, figure-8 pattern at mid-stroke to strengthen "
            "the catch); "
            "Doggy Paddle (arms stay underwater throughout, focus on body rotation and "
            "keeping hips high); "
            "Single Arm (one arm at the side, stroke with the other — develop rotation "
            "and balance, switch arms each length); "
            "Kick on Side (lie on your side, lower arm extended, kick and rotate to "
            "breathe — addresses crossover and improves streamlining). "
            "Each step description must be one brief sentence cueing the drill's key mechanic. "
            "Aim for variety across different movement patterns (kick, pull, catch, rotation)."
        ),
        "speed": (
            "Short, fast repeats at near-maximal effort with full recovery (30-60s rest) so quality is maintained "
            "across all reps. Use 50m repeats; 6-12 reps is typical. Descriptions should cue explosive starts, "
            "high stroke rate, and a strong finish."
        ),
        "endurance": (
            "Longer steady repeats or sustained continuous swimming with short rest (10-20s). "
            "Effort stays controlled and comfortable throughout. "
            "Descriptions should emphasise rhythm, controlled breathing, and maintaining "
            "good form."
        ),
        "recovery": (
            "Active recovery session. Keep everything easy and predictable. "
            "Prefer continuous swimming over intervals. Use generous rest between any effort "
            "changes (45-60s). Target the low end of the distance range. No intensity spikes."
        ),
        "fun": (
            "Create an engaging, varied session. Mix distances, formats, strokes, or drill "
            "types across steps to keep interest high — e.g. a kick set followed by fist "
            "drill followed by a build swim. Descriptions should be encouraging and "
            "specific about what the swimmer is doing and why."
        ),
        "steady": (
            "Aerobic threshold pace. All reps at the same controlled, repeatable effort with "
            "consistent rest. Avoid pyramids, descending rest, or mixed pacing. Descriptions "
            "should emphasise holding a steady tempo."
        ),
        "short": "Efficient structure. Minimise transition steps. Prioritise quality over quantity.",
        "hard": (
            "High intensity. Use short rest (10-20s) between intervals or reduce rep distance "
            "so quality is maintained throughout. Descriptions should cue maximum sustainable "
            "effort and strong body position."
        ),
        "easy": "Low intensity throughout. Prioritise smooth technique and controlled breathing over pace.",
        "freestyle": "Use freestyle as the primary stroke in the main_set. Only deviate for explicit drill steps.",
        "mixed": "Rotate strokes across steps. Include at least two different strokes in the main_set.",
        "butterfly": (
            "Include butterfly in at least one main_set step. Use short distances (25-50m per "
            "rep) given its technical demands and energy cost. Describe body undulation and "
            "timing cues."
        ),
        "kick": (
            "Include a dedicated kick step in the main_set (no arm pull; kickboard or streamline). "
            "Place it as the first main_set step, followed by the primary work. "
            "Descriptions should cue tight flutter kick from the hips, limited knee bend, and relaxed ankles."
        ),
        "pull": (
            "Include a pull-focused step (pull buoy, no kick) in the main_set to emphasise "
            "catch and upper-body engagement. Good for isolating the pull phase and building "
            "feel for the water."
        ),
        "threshold": (
            "Firm, comfortably hard effort the swimmer can just sustain. Use 200-400m repeats "
            "with short rest (15-30s). Descriptions should cue holding an even pace and "
            "staying relaxed under pressure."
        ),
        "sprints": (
            "Maximum effort short repeats (50m). Full recovery between each (45-90s). "
            "Focus on explosive power and peak speed. 6-10 reps is typical. Describe "
            "drive off the wall and maintaining stroke rate to the flags."
        ),
    }

    hints = [hint_map[tag] for tag in requested_tags if tag in hint_map]
    if not hints:
        return "Reflect requested tags in step descriptions and structure where compatible with constraints."
    return " ".join(hints)


def _distance_guidance(duration_minutes: int, effort: str) -> str:
    pace_by_effort = {"easy": (25, 35), "medium": (30, 40), "hard": (35, 45)}
    lo_ppm, hi_ppm = pace_by_effort.get(effort, (30, 40))
    lo = duration_minutes * lo_ppm
    hi = duration_minutes * hi_ppm
    return (
        f"Target estimated_distance_m for this request: {lo}-{hi}m "
        f"(derived from duration={duration_minutes} and effort={effort})."
    )


def _effort_hint(effort: str) -> str:
    hints_map = {
        "easy": (
            "Aerobic recovery pace — all steps should feel comfortable throughout. "
            "Warm-up: 1-2 easy continuous swims (100-200m each). "
            "Main set: longer repeats (100-200m each) or continuous swimming with 15-30s rest. "
            "Cool-down: very easy choice of stroke. No intensity spikes anywhere."
        ),
        "medium": (
            "Steady work at a comfortably challenging pace the swimmer can sustain. "
            "Warm-up: easy continuous build, optionally ending with 4×50m progressive activation. "
            "Main set: 100-200m repeats with 15-30s rest, or longer sustained efforts. "
            "Cool-down: easy relaxed swimming."
        ),
        "hard": (
            "High-intensity training. "
            "Warm-up is critical: include an easy build and a brief activation piece "
            "(e.g. 4-6×50m at medium effort) before the main set. "
            "Main set: short-to-medium repeats (50-100m each) with adequate rest (20-45s) to "
            "preserve quality across all reps — quality over volume. "
            "Total session volume should be lower than an equivalent easy or medium session. "
            "Cool-down: minimum 100m of easy continuous swimming."
        ),
    }
    return hints_map.get(effort, "Use balanced effort progression across sections.")


def _section_proportion_guidance(effort: str, duration_minutes: int) -> str:
    pace_by_effort = {"easy": (25, 35), "medium": (30, 40), "hard": (35, 45)}
    lo_ppm, hi_ppm = pace_by_effort.get(effort, (30, 40))
    target = round(duration_minutes * (lo_ppm + hi_ppm) / 2 / 50) * 50

    warm_frac = {"easy": 0.22, "medium": 0.20, "hard": 0.22}.get(effort, 0.20)
    cool_frac = {"easy": 0.16, "medium": 0.13, "hard": 0.10}.get(effort, 0.15)

    warm = max(round(target * warm_frac / 50) * 50, 50)
    cool = max(round(target * cool_frac / 50) * 50, 50)
    main = target - warm - cool
    if main < 50:
        main = 50

    return (
        f"Suggested section distances for this session (all must be exact multiples of 50m): "
        f"warm_up ~{warm}m, main_set ~{main}m, cool_down ~{cool}m "
        f"(total ~{warm + main + cool}m)."
    )


def _session_type_override(requested_tags: list[str], effort: str) -> str:
    if "technique" not in requested_tags:
        return ""

    effort_expression = {
        "easy": (
            "Use generous rest between drill reps (30-45s) and low rep counts. "
            "Focus entirely on quality of movement, not speed."
        ),
        "medium": (
            "Use moderate rest between drill reps (20-30s). "
            "Aim for controlled, consistent mechanics across all reps."
        ),
        "hard": (
            "Use shorter rest between drill reps (10-20s) and higher rep counts "
            "to build technique under fatigue. Still prioritise clean mechanics over pace."
        ),
    }.get(effort, "Adjust rest to match the requested effort level.")

    return (
        "SESSION TYPE: TECHNIQUE / DRILL CIRCUIT\n"
        "This overrides the default effort-based main_set structure.\n"
        "The main_set MUST contain 3-5 steps, each using a DIFFERENT named drill type.\n"
        "Valid drill types: Kick, Pull, Fists, Front Scull, Mid Scull, "
        "Doggy Paddle, Single Arm, Kick on Side.\n"
        "Do NOT use plain freestyle interval repeats in the main_set.\n"
        "Do NOT repeat the same drill type in more than one step.\n"
        f"The effort value '{effort}' is expressed as: {effort_expression}\n"
        "Each step description must be one concise sentence: name the drill and give the single most important coaching cue."
    )


def _style_hint(prefer_varied: bool) -> str:
    if prefer_varied:
        return (
            "Inferred preferred style is varied. Build a main set with 2-3 distinct steps "
            "while preserving schema consistency."
        )
    return "Inferred preferred style is straightforward. Keep the main set to one clear pattern."


def build_user_prompt(
    payload: SwimPlanInput,
    schema_excerpt: str,
    history_summary: str,
) -> str:
    requested_tags = _requested_tags(payload)
    effort = payload.session_requested.effort
    duration = payload.session_requested.duration_minutes
    prefer_varied = infer_prefer_varied_from_payload(payload)

    effort_hint = _effort_hint(effort)
    style_hint = _style_hint(prefer_varied)
    distance_guidance = _distance_guidance(duration, effort)
    tag_hints = _requested_tag_hints(requested_tags)
    section_proportions = _section_proportion_guidance(effort, duration)
    session_override = _session_type_override(requested_tags, effort)
    inferred_style = "varied" if prefer_varied else "straightforward"

    override_block = (
        f"SESSION OVERRIDE (takes precedence over EFFORT GUIDANCE for main_set structure):\n"
        f"{session_override}\n\n"
        if session_override
        else ""
    )

    effort_block = (
        f"EFFORT GUIDANCE:\n"
        f"main_set structure is defined by the SESSION OVERRIDE — apply effort '{effort}' "
        f"as described there.\n"
        f"For warm_up and cool_down sections: {effort_hint}\n\n"
        if session_override
        else f"EFFORT GUIDANCE:\n{effort_hint}\n\n"
    )

    return (
        "Generate a personalised swim session plan.\n\n"
        "DECISION PRIORITY (follow in this order):\n"
        "1. Return valid JSON matching the schema exactly.\n"
        "2. Match requested duration_minutes.\n"
        "3. If a SESSION OVERRIDE is present, honour it for main_set structure before applying effort guidance.\n"
        "4. Match requested effort (expressed through rest duration and rep density, not set type).\n"
        "5. Match inferred session style from requested tags + history.\n"
        "6. Use history to prefer previously successful structure and volume.\n"
        "7. Apply remaining requested tags where compatible.\n\n"
        "REQUEST:\n"
        f"{json.dumps(payload.session_requested.model_dump(), sort_keys=True)}\n\n"
        f"{override_block}"
        "INFERRED STYLE:\n"
        f"{inferred_style}\n\n"
        "REQUESTED TAGS:\n"
        f"{json.dumps(requested_tags)}\n"
        f"{tag_hints}\n\n"
        "HISTORIC GUIDANCE:\n"
        f"{history_summary}\n\n"
        f"{effort_block}"
        "STYLE GUIDANCE:\n"
        f"{style_hint}\n\n"
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
        "- All distances must be exact multiples of 50 (50, 100, 150, 200, ...): "
        "distance_per_rep_m, section_distance_m, and estimated_distance_m.\n"
        "- Minimum distance_per_rep_m is 50m. Never use 25m or any non-multiple of 50.\n"
        "- Never use fractional distances. All distance values must be whole integers.\n"
        "- reps must be > 0.\n"
        "- A step with reps: 1 must use kind: 'continuous', never kind: 'intervals'.\n"
        "- warm_up and cool_down must each contain at most 2 steps.\n"
        "- distance_per_rep_m must be >= 50.\n"
        "- rest_seconds must be null or >= 0.\n"
        "- Allowed kind values: continuous, intervals.\n"
        "- Allowed stroke values: freestyle, backstroke, breaststroke, butterfly, mixed, choice.\n"
        "- Allowed effort values: easy, medium, hard.\n"
        "- All warm_up steps must use effort: easy.\n"
        "- All cool_down steps must use effort: easy.\n\n"
        "SESSION-SPECIFIC RULES:\n"
        "- If a SESSION OVERRIDE is present: its rules for main_set structure are mandatory and override style rules below.\n"
        "- If no SESSION OVERRIDE: straightforward style → main_set must contain one clear pattern only.\n"
        "- If no SESSION OVERRIDE: varied style → main_set should contain 2-3 distinct steps with clear variation.\n"
        "- Step descriptions must be concise: one brief sentence with the single most important coaching cue. Do not write multiple sentences.\n"
        "- Step descriptions must use plain, everyday language. Never use technical terms — do not use words like 'phosphocreatine', 'lactate', 'aerobic', 'anaerobic', 'threshold', 'ATP', 'fast-twitch', or 'energy systems' in descriptions.\n"
        "- If disliked history suggests pace-too-fast, long, or tiring, avoid long hard continuous main sets over 500m.\n"
        "- For hard effort without a SESSION OVERRIDE, increase intensity using interval density or shorter rest, not excessive distance.\n"
        "- For hard sessions, warm_up must include a short activation piece before the main set.\n"
        "- Prefer expressing requested tag intent in the main_set first.\n\n"
        "OUTPUT SHAPE EXAMPLE:\n"
        f"{schema_excerpt}\n\n"
        "Return the final JSON object only."
    )


def build_repair_prompt(original_text: str, error_text: str, schema_excerpt: str) -> str:
    return (
        "Your previous response was invalid.\n\n"
        "TASK:\n"
        "Return a corrected version of the JSON only.\n"
        "Do not explain the error.\n"
        "Do not include markdown.\n"
        "Do not include any text before or after the JSON.\n\n"
        "VALIDATION ERROR:\n"
        f"{error_text}\n\n"
        "PREVIOUS OUTPUT:\n"
        f"{original_text}\n\n"
        "REQUIRED SHAPE:\n"
        f"{schema_excerpt}\n\n"
        "Return one corrected JSON object only."
    )


def _chat_completion(messages: list[dict[str, str]], seed: Optional[int]) -> str:
    _load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing")

    try:
        from openai import OpenAI
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("openai package not available") from exc

    client = OpenAI(api_key=api_key)
    model = os.getenv("SWIM_PLANNER_MODEL", "gpt-4.1-mini")

    params = {
        "model": model,
        "messages": messages,
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    if seed is not None:
        params["seed"] = seed

    response = client.chat.completions.create(**params)
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("Model returned empty response")
    return content


def request_plan_json(payload: SwimPlanInput, seed: Optional[int]) -> str:
    schema_excerpt = _schema_excerpt()
    history_summary = summarize_history(payload.historic_sessions)

    messages = [
        {"role": "system", "content": build_system_prompt()},
        {
            "role": "user",
            "content": build_user_prompt(payload, schema_excerpt, history_summary),
        },
    ]
    return _chat_completion(messages, seed)


def request_repair_json(
    payload: SwimPlanInput,
    bad_output: str,
    error_text: str,
    seed: Optional[int],
) -> str:
    _ = payload
    schema_excerpt = _schema_excerpt()

    messages = [
        {"role": "system", "content": build_system_prompt()},
        {
            "role": "user",
            "content": build_repair_prompt(bad_output, error_text, schema_excerpt),
        },
    ]
    return _chat_completion(messages, seed)
