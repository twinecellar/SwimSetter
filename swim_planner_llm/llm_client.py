from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from .models import HistoricSession, SwimPlanInput
from .style_inference import infer_prefer_varied_from_payload

SYSTEM_PROMPT = (
    "You are a swim session planner. You must return valid JSON matching the provided schema. "
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


def summarize_history(historic_sessions: list[HistoricSession]) -> str:
    up_distances: list[int] = []
    down_distances: list[int] = []
    up_tags: set[str] = set()
    down_tags: set[str] = set()
    disliked_long_hard_continuous = False

    for item in historic_sessions:
        d = _extract_distance(item)
        tags = {t.strip().lower() for t in item.tags if t and t.strip()}

        if item.thumb == 1:
            if d:
                up_distances.append(d)
            up_tags.update(tags)
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
            "Include drill-oriented or form-focused language, especially in warm_up "
            "or early main_set."
        ),
        "speed": (
            "Bias the main_set toward shorter interval repeats with firmer effort "
            "and controlled rest."
        ),
        "endurance": (
            "Bias toward longer repeats or more continuous aerobic structure, within "
            "historically tolerated volume."
        ),
        "recovery": "Use easy pacing, generous rest, and simple structure.",
        "fun": (
            "Use engaging but still clear set descriptions; mild variation is acceptable "
            "if compatible with inferred style guidance."
        ),
        "steady": "Prefer repeatable, even-paced aerobic efforts over abrupt pace changes.",
        "short": "Keep the plan efficient and avoid unnecessary extra steps.",
        "hard": "Express intensity through interval density or reduced rest, not excessive volume.",
        "easy": "Keep effort controlled and low stress.",
        "freestyle": "Prefer freestyle in the main_set where possible.",
        "mixed": "Allow mixed stroke usage where appropriate.",
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
        "easy": "Prioritize relaxed pacing, longer recoveries, and low complexity.",
        "medium": "Use steady aerobic work with moderate rest and controlled intensity.",
        "hard": "Increase interval density or reduce rest; avoid excessive volume spikes.",
    }
    return hints_map.get(effort, "Use balanced effort progression across sections.")


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
    inferred_style = "varied" if prefer_varied else "straightforward"

    return (
        "Generate a personalised swim session plan.\n\n"
        "DECISION PRIORITY (follow in this order):\n"
        "1. Return valid JSON matching the schema exactly.\n"
        "2. Match requested duration_minutes.\n"
        "3. Match requested effort.\n"
        "4. Match inferred session style from requested tags + history.\n"
        "5. Use history to prefer previously successful structure and volume.\n"
        "6. Apply requested tags where compatible.\n\n"
        "REQUEST:\n"
        f"{json.dumps(payload.session_requested.model_dump(), sort_keys=True)}\n\n"
        "INFERRED STYLE:\n"
        f"{inferred_style}\n\n"
        "REQUESTED TAGS:\n"
        f"{json.dumps(requested_tags)}\n"
        f"{tag_hints}\n\n"
        "HISTORIC GUIDANCE:\n"
        f"{history_summary}\n\n"
        "EFFORT GUIDANCE:\n"
        f"{effort_hint}\n\n"
        "STYLE GUIDANCE:\n"
        f"{style_hint}\n\n"
        "DISTANCE GUIDANCE:\n"
        f"{distance_guidance}\n\n"
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
        "- All distances must be divisible by 50.\n"
        "- reps must be > 0.\n"
        "- distance_per_rep_m must be > 0.\n"
        "- rest_seconds must be null or >= 0.\n"
        "- Allowed kind values: continuous, intervals.\n"
        "- Allowed stroke values: freestyle, backstroke, breaststroke, mixed, choice.\n"
        "- Allowed effort values: easy, medium, hard.\n\n"
        "SESSION-SPECIFIC RULES:\n"
        "- If inferred style is straightforward: main_set must contain one clear pattern only.\n"
        "- If inferred style is varied: main_set should usually contain 2-3 distinct steps with clear variation.\n"
        "- If disliked history suggests pace-too-fast, long, or tiring, avoid long hard continuous main sets over 500m.\n"
        "- For hard effort, increase intensity using interval density or shorter rest, not excessive distance.\n"
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
