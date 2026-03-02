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
from .v2.prompts import (
    build_repair_prompt_v2,
    build_system_prompt_v2,
    build_user_prompt_v2,
)
from .v2.router import build_generation_spec_v2


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


def request_plan_json_claude(
    payload: SwimPlanInput,
    seed: Optional[int],
    *,
    version: str = "v1",
) -> str:
    history_summary = summarize_history(payload.historic_sessions)

    if version == "v1":
        system = build_system_prompt()
        user = build_user_prompt(payload, _schema_excerpt(), history_summary)
    elif version == "v2":
        spec = build_generation_spec_v2(payload)
        system = build_system_prompt_v2()
        user = build_user_prompt_v2(payload, history_summary, spec)
    else:
        raise ValueError(f"Unknown version '{version}'. Use 'v1' or 'v2'.")

    return _chat_completion_claude(system, user)


def request_repair_json_claude(
    payload: SwimPlanInput,
    bad_output: str,
    error_text: str,
    seed: Optional[int],
    *,
    version: str = "v1",
) -> str:
    if version == "v1":
        system = build_system_prompt()
        user = build_repair_prompt(bad_output, error_text, _schema_excerpt())
    elif version == "v2":
        spec = build_generation_spec_v2(payload)
        system = build_system_prompt_v2()
        user = build_repair_prompt_v2(bad_output, error_text, spec)
    else:
        raise ValueError(f"Unknown version '{version}'. Use 'v1' or 'v2'.")

    return _chat_completion_claude(system, user)
