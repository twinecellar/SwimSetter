from __future__ import annotations

import json
from typing import Optional

from pydantic import ValidationError

from .formatter import plan_to_canonical_text
from .llm_client import request_plan_json, request_repair_json
from .models import LLMPlanDraft, SwimPlanInput, SwimPlanResponse
from .validator import ValidationIssue, enforce_and_normalize, validate_invariants, validate_schema


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
) -> SwimPlanResponse:
    data = _parse_llm_json(raw_text)
    try:
        draft = LLMPlanDraft.model_validate(data)
    except ValidationError as exc:
        raise ValidationIssue(f"draft schema failed: {exc}") from exc

    plan = enforce_and_normalize(draft, payload.session_requested, seed)
    validate_schema(plan)
    validate_invariants(plan, payload.session_requested, payload.historic_sessions)
    return plan


def generate_swim_plan(payload: dict, seed: Optional[int] = None) -> SwimPlanResponse:
    parsed_payload = SwimPlanInput.model_validate(payload)

    first_error: Optional[str] = None
    first_raw = ""

    try:
        first_raw = request_plan_json(parsed_payload, seed)
        return _build_valid_plan_from_llm(first_raw, parsed_payload, seed)
    except Exception as exc:
        first_error = str(exc)

    try:
        repair_raw = request_repair_json(
            parsed_payload,
            bad_output=first_raw or "<empty>",
            error_text=first_error or "unknown validation failure",
            seed=seed,
        )
        return _build_valid_plan_from_llm(repair_raw, parsed_payload, seed)
    except Exception as exc:
        raise ValidationIssue(
            "Plan generation failed after initial call and one repair attempt. "
            f"Initial error: {first_error}. Repair error: {exc}"
        ) from exc


__all__ = ["generate_swim_plan", "plan_to_canonical_text"]
