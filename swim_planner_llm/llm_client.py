from __future__ import annotations

import json
import os
from typing import Optional

from .models import HistoricSession, SwimPlanInput

SYSTEM_PROMPT = (
    "You are a swim session planner. You must return valid JSON matching the provided schema. "
    "Do not include markdown, comments or extra keys."
)


def build_system_prompt() -> str:
    return SYSTEM_PROMPT


def _schema_excerpt() -> str:
    return (
        '{'
        '"plan_id":"uuid",'
        '"created_at":"ISO datetime",'
        '"duration_minutes":int,'
        '"estimated_distance_m":int,'
        '"sections":{'
        '"warm_up":{"title":str,"section_distance_m":int,"steps":[Step]},'
        '"main_set":{"title":str,"section_distance_m":int,"steps":[Step]},'
        '"cool_down":{"title":str,"section_distance_m":int,"steps":[Step]}'
        '}'
        '}'
        '\n'
        'Step={'
        '"step_id":str,'
        '"kind":"continuous|intervals",'
        '"reps":int>0,'
        '"distance_per_rep_m":int>0,'
        '"stroke":"freestyle|backstroke|breaststroke|butterfly|mixed|choice",'
        '"rest_seconds":int>=0|null,'
        '"effort":"easy|medium|hard",'
        '"description":str'
        '}'
    )


def _extract_distance(history: HistoricSession) -> Optional[int]:
    plan = history.session_plan or {}
    value = plan.get("estimated_distance_m")
    return value if isinstance(value, int) and value > 0 else None


def summarize_history(historic_sessions: list[HistoricSession]) -> str:
    up_distances: list[int] = []
    down_distances: list[int] = []
    down_tags: set[str] = set()

    for item in historic_sessions:
        d = _extract_distance(item)
        if item.thumb == 1:
            if d:
                up_distances.append(d)
        else:
            if d:
                down_distances.append(d)
            down_tags.update(t.strip().lower() for t in item.tags if t and t.strip())

    def _range(values: list[int]) -> str:
        if not values:
            return "none"
        return f"{min(values)}-{max(values)}m"

    return (
        f"liked_distance_range={_range(up_distances)}; "
        f"disliked_distance_range={_range(down_distances)}; "
        f"disliked_tags={sorted(down_tags) if down_tags else []}"
    )


def build_user_prompt(payload: SwimPlanInput, schema_excerpt: str, history_summary: str) -> str:
    constraints = (
        "Constraints:\n"
        "- Include warm_up, main_set, cool_down\n"
        "- Sum step distances into section_distance_m and estimated_distance_m\n"
        "- straightforward => main_set one pattern only\n"
        "- Avoid hard continuous main >500m if disliked tags include pace-too-fast/long/tiring\n"
        "- Return ONE JSON object ONLY"
    )
    return (
        "session_requested:\n"
        f"{json.dumps(payload.session_requested.model_dump(), sort_keys=True)}\n"
        "historic_summary:\n"
        f"{history_summary}\n"
        "schema:\n"
        f"{schema_excerpt}\n"
        f"{constraints}"
    )


def build_repair_prompt(original_text: str, error_text: str, schema_excerpt: str) -> str:
    return (
        "The previous output was invalid.\n"
        f"Validation error:\n{error_text}\n"
        "Original JSON/text:\n"
        f"{original_text}\n"
        "Schema:\n"
        f"{schema_excerpt}\n"
        "Return corrected JSON only. One JSON object."
    )


def _chat_completion(messages: list[dict[str, str]], seed: Optional[int]) -> str:
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
