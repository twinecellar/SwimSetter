from __future__ import annotations

from typing import Iterable

from .models import HistoricSession, SwimPlanInput

VARIED_REQUEST_TAGS = {"fun", "mixed", "technique", "speed"}
STRAIGHTFORWARD_REQUEST_TAGS = {"recovery", "steady", "freestyle"}
VARIED_HISTORY_TAGS = {"fun", "mixed", "varied", "technique"}


def _normalize_tags(tags: Iterable[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for value in tags:
        cleaned = value.strip().lower()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        normalized.append(cleaned)

    return normalized


def infer_prefer_varied(
    requested_tags: list[str],
    historic_sessions: list[HistoricSession],
) -> bool:
    score = 0

    for tag in _normalize_tags(requested_tags):
        if tag in VARIED_REQUEST_TAGS:
            score += 2
        if tag in STRAIGHTFORWARD_REQUEST_TAGS:
            score -= 1

    for session in historic_sessions:
        tags = set(_normalize_tags(session.tags))
        varied_like = bool(tags.intersection(VARIED_HISTORY_TAGS))
        if not varied_like:
            continue

        if session.thumb == 1:
            score += 1
        elif session.thumb == 0:
            score -= 1

    return score > 0


def infer_prefer_varied_from_payload(payload: SwimPlanInput) -> bool:
    merged_tags = payload.session_requested.requested_tags + payload.requested_tags
    return infer_prefer_varied(merged_tags, payload.historic_sessions)
