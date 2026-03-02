from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from swim_planner_llm.models import StepKind


ArchetypeId = Literal[
    "flow_reset",
    "cruise_builder",
    "playful_alternator",
    "mini_block_roulette",
    "stroke_switch_ladder",
    "punchy_pops",
    "gear_change_up",
    "technique_refresh",
    "choice_session",
    "benchmark_lite",
]


@dataclass(frozen=True)
class ArchetypeContract:
    archetype_id: ArchetypeId
    display_name: str
    min_main_steps: int
    max_main_steps: int
    allowed_main_kinds: frozenset[StepKind]
    trigger_tags: frozenset[str]
    routing_priority: int
    allow_hypoxic_if_tagged: bool = True
    allow_underwater_if_tagged: bool = False


@dataclass(frozen=True)
class SectionBlueprint:
    steps: int
    allowed_kinds_by_step: tuple[frozenset[StepKind], ...]


@dataclass(frozen=True)
class BlueprintV2:
    warm_up: SectionBlueprint
    main_set: SectionBlueprint
    cool_down: SectionBlueprint


@dataclass(frozen=True)
class GenerationSpecV2:
    archetype: ArchetypeContract
    blueprint: BlueprintV2
    requested_tags: tuple[str, ...]
    forced_by_tags: bool

