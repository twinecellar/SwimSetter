from __future__ import annotations

import os
from typing import Optional

from .llm_client import (
    _load_dotenv,
    _schema_excerpt,
    build_system_prompt,
    build_user_prompt,
    build_repair_prompt,
    summarize_history,
)
from .models import SwimPlanInput


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` wrappers Claude sometimes adds."""
    stripped = text.strip()
    if stripped.startswith("```"):
        # Drop the opening fence line (e.g. ```json or ```)
        first_newline = stripped.find("\n")
        if first_newline != -1:
            stripped = stripped[first_newline + 1:]
        # Drop the closing fence
        if stripped.endswith("```"):
            stripped = stripped[: stripped.rfind("```")]
    return stripped.strip()


def _chat_completion_claude(system: str, user: str) -> str:
    _load_dotenv()
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing")

    try:
        import anthropic
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("anthropic package not available") from exc

    client = anthropic.Anthropic(api_key=api_key)
    model = os.getenv("SWIM_PLANNER_CLAUDE_MODEL", "claude-haiku-4-5-20251001")

    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    content = response.content[0].text if response.content else ""
    if not content:
        raise RuntimeError("Model returned empty response")
    return _strip_markdown_fences(content)


def request_plan_json_claude(payload: SwimPlanInput, seed: Optional[int]) -> str:
    schema_excerpt = _schema_excerpt()
    history_summary = summarize_history(payload.historic_sessions)
    system = build_system_prompt()
    user = build_user_prompt(payload, schema_excerpt, history_summary)
    return _chat_completion_claude(system, user)


def request_repair_json_claude(
    payload: SwimPlanInput,
    bad_output: str,
    error_text: str,
    seed: Optional[int],
) -> str:
    _ = payload
    schema_excerpt = _schema_excerpt()
    system = build_system_prompt()
    user = build_repair_prompt(bad_output, error_text, schema_excerpt)
    return _chat_completion_claude(system, user)
