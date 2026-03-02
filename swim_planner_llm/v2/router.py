from __future__ import annotations

from typing import Iterable

from swim_planner_llm.models import HistoricSession, SwimPlanInput
from swim_planner_llm.style_inference import infer_prefer_varied_from_payload

from .archetypes import ARCHETYPES, DISPLAY_NAME_TO_ID
from .blueprint import build_blueprint_v2
from .types import ArchetypeId, GenerationSpecV2


_RISK_TAGS = {"pace-too-fast", "long", "tiring"}


def _normalize_tags(tags: Iterable[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for value in tags:
        cleaned = (value or "").strip().lower()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        out.append(cleaned)
    return out


def _merged_requested_tags(payload: SwimPlanInput) -> list[str]:
    return _normalize_tags(
        payload.session_requested.requested_tags + payload.requested_tags
    )


def _has_sensitive_down_feedback(historic_sessions: list[HistoricSession]) -> bool:
    for session in historic_sessions:
        if session.thumb != 0:
            continue
        lowered = {t.strip().lower() for t in session.tags if t and t.strip()}
        if lowered.intersection(_RISK_TAGS):
            return True
    return False


def _extract_last_v2_archetype_id(historic_sessions: list[HistoricSession]) -> ArchetypeId | None:
    for session in reversed(historic_sessions):
        plan = session.session_plan or {}
        title = (
            (plan.get("sections") or {})
            .get("main_set", {})
            .get("title", "")
        )
        if not isinstance(title, str) or "—" not in title:
            continue
        _, _, suffix = title.partition("—")
        name = suffix.strip().lower()
        if not name:
            continue
        archetype_id = DISPLAY_NAME_TO_ID.get(name)
        if archetype_id:
            return archetype_id
    return None


def _route_archetype_id(
    payload: SwimPlanInput,
    requested_tags: set[str],
) -> tuple[ArchetypeId, bool]:
    """
    Returns (archetype_id, forced_by_tags).
    forced_by_tags is true when the archetype was selected via trigger_tags.
    """
    matches = [a for a in ARCHETYPES.values() if a.trigger_tags & requested_tags]
    if matches:
        winner = min(matches, key=lambda a: a.routing_priority)
        archetype_id = winner.archetype_id
        # mixed + beginner → mini_block_roulette (simpler structure for newer swimmers)
        if archetype_id == "stroke_switch_ladder" and payload.session_requested.swim_level == "beginner":
            archetype_id = "mini_block_roulette"
        return archetype_id, True

    # fun is history-dependent: can't be expressed as static trigger_tags
    if "fun" in requested_tags:
        prefer_varied = infer_prefer_varied_from_payload(payload)
        return ("mini_block_roulette" if prefer_varied else "playful_alternator"), False

    return "flow_reset", False


def _rotate_if_repeating(
    archetype_id: ArchetypeId,
    *,
    last_archetype_id: ArchetypeId | None,
    forced_by_tags: bool,
) -> ArchetypeId:
    if forced_by_tags:
        return archetype_id
    if last_archetype_id is None or archetype_id != last_archetype_id:
        return archetype_id

    rotation = {
        "mini_block_roulette": "playful_alternator",
        "playful_alternator": "mini_block_roulette",
        "cruise_builder": "flow_reset",
        "flow_reset": "cruise_builder",
    }
    return rotation.get(archetype_id, archetype_id)


def build_generation_spec_v2(payload: SwimPlanInput) -> GenerationSpecV2:
    tags_list = _merged_requested_tags(payload)
    requested_tags = set(tags_list)

    archetype_id, forced_by_tags = _route_archetype_id(payload, requested_tags)

    sensitive = _has_sensitive_down_feedback(payload.historic_sessions)
    if sensitive and archetype_id in {"stroke_switch_ladder", "punchy_pops"}:
        # Avoid spiky / cognitively heavier sessions unless explicitly requested.
        if archetype_id == "stroke_switch_ladder" and "mixed" not in requested_tags:
            archetype_id = "cruise_builder"
        if archetype_id == "punchy_pops" and not ({"speed", "sprints"} & requested_tags):
            archetype_id = "flow_reset"

    last = _extract_last_v2_archetype_id(payload.historic_sessions)
    archetype_id = _rotate_if_repeating(
        archetype_id,
        last_archetype_id=last,
        forced_by_tags=forced_by_tags,
    )

    archetype = ARCHETYPES[archetype_id]
    blueprint = build_blueprint_v2(archetype, payload)

    return GenerationSpecV2(
        archetype=archetype,
        blueprint=blueprint,
        requested_tags=tuple(tags_list),
        forced_by_tags=forced_by_tags,
    )
