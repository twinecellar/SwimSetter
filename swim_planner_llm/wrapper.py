from __future__ import annotations

import json
from typing import Optional

from pydantic import ValidationError

from .formatter import plan_to_canonical_text
from .llm_client_claude import request_plan_json_claude, request_repair_json_claude
from .models import LLMPlanDraft, SwimPlanInput, SwimPlanResponse
from .validator import ValidationIssue, enforce_and_normalize, validate_invariants, validate_schema
from .v2.router import build_generation_spec_v2


def _parse_llm_json(raw_text: str) -> dict:
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValidationIssue(f"json parse failed: {exc}") from exc

    if not isinstance(data, dict):
        raise ValidationIssue("llm output must be a single JSON object")
    return data


def _build_valid_plan_from_llm(
    raw_text: str,
    payload: SwimPlanInput,
    seed: Optional[int],
    *,
    version: str,
    v2_spec=None,
) -> SwimPlanResponse:
    data = _parse_llm_json(raw_text)
    try:
        draft = LLMPlanDraft.model_validate(data)
    except ValidationError as exc:
        raise ValidationIssue(f"draft schema failed: {exc}") from exc

    plan = enforce_and_normalize(draft, payload.session_requested, seed)
    if version == "v2" and v2_spec is not None:
        plan.sections.main_set.title = f"Main Set — {v2_spec.archetype.display_name}"
    validate_schema(plan)
    validate_invariants(
        plan,
        payload.session_requested,
        payload.historic_sessions,
        payload.requested_tags,
        version=version,
        v2_spec=v2_spec,
    )
    return plan


def generate_swim_plan(
    payload: dict,
    seed: Optional[int] = None,
    provider: str = "claude",
    *,
    version: str = "v1",
) -> SwimPlanResponse:
    parsed_payload = SwimPlanInput.model_validate(payload)

    if provider == "openai":
        raise ValueError("OpenAI provider is disabled for now. Use provider='claude'.")
    if provider == "claude":
        _request_plan = request_plan_json_claude
        _request_repair = request_repair_json_claude
    else:
        raise ValueError(f"Unknown provider '{provider}'. Use 'claude'.")

    first_error: Optional[str] = None
    first_raw = ""
    v2_spec = build_generation_spec_v2(parsed_payload) if version == "v2" else None

    try:
        first_raw = _request_plan(parsed_payload, seed, version=version)
        return _build_valid_plan_from_llm(
            first_raw,
            parsed_payload,
            seed,
            version=version,
            v2_spec=v2_spec,
        )
    except Exception as exc:
        first_error = str(exc)

    try:
        repair_raw = _request_repair(
            parsed_payload,
            bad_output=first_raw or "<empty>",
            error_text=first_error or "unknown validation failure",
            seed=seed,
            version=version,
        )
        return _build_valid_plan_from_llm(
            repair_raw,
            parsed_payload,
            seed,
            version=version,
            v2_spec=v2_spec,
        )
    except Exception as exc:
        raise ValidationIssue(
            "Plan generation failed after initial call and one repair attempt. "
            f"Initial error: {first_error}. Repair error: {exc}"
        ) from exc


__all__ = ["generate_swim_plan", "plan_to_canonical_text"]
