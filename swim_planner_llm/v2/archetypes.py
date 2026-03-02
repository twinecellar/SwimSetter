from __future__ import annotations

from swim_planner_llm.models import StepKind

from .types import ArchetypeContract, ArchetypeId


def _kinds(*values: StepKind) -> frozenset[StepKind]:
    return frozenset(values)


ARCHETYPES: dict[ArchetypeId, ArchetypeContract] = {
    "flow_reset": ArchetypeContract(
        archetype_id="flow_reset",
        display_name="Flow Reset",
        min_main_steps=1,
        max_main_steps=2,
        allowed_main_kinds=_kinds("continuous", "intervals", "build"),
        trigger_tags=frozenset({"recovery"}),
        routing_priority=80,
        allow_hypoxic_if_tagged=False,
        allow_underwater_if_tagged=False,
    ),
    "cruise_builder": ArchetypeContract(
        archetype_id="cruise_builder",
        display_name="Cruise Builder",
        min_main_steps=1,
        max_main_steps=2,
        allowed_main_kinds=_kinds(
            "intervals",
            "build",
            "negative_split",
            "continuous",
        ),
        trigger_tags=frozenset({"steady", "endurance"}),
        routing_priority=70,
        allow_hypoxic_if_tagged=True,
        allow_underwater_if_tagged=False,
    ),
    "playful_alternator": ArchetypeContract(
        archetype_id="playful_alternator",
        display_name="Playful Alternator",
        min_main_steps=1,
        max_main_steps=2,
        allowed_main_kinds=_kinds("intervals", "continuous"),
        trigger_tags=frozenset(),
        routing_priority=100,
        allow_hypoxic_if_tagged=True,
        allow_underwater_if_tagged=False,
    ),
    "mini_block_roulette": ArchetypeContract(
        archetype_id="mini_block_roulette",
        display_name="Mini Block Roulette",
        min_main_steps=3,
        max_main_steps=4,
        allowed_main_kinds=_kinds("intervals", "continuous", "build", "broken", "fartlek"),
        trigger_tags=frozenset(),
        routing_priority=90,
        allow_hypoxic_if_tagged=True,
        allow_underwater_if_tagged=False,
    ),
    "stroke_switch_ladder": ArchetypeContract(
        archetype_id="stroke_switch_ladder",
        display_name="Stroke-Switch Ladder",
        min_main_steps=1,
        max_main_steps=2,
        allowed_main_kinds=_kinds("pyramid", "ascending", "descending", "intervals"),
        trigger_tags=frozenset({"mixed"}),
        routing_priority=50,
        allow_hypoxic_if_tagged=True,
        allow_underwater_if_tagged=False,
    ),
    "punchy_pops": ArchetypeContract(
        archetype_id="punchy_pops",
        display_name="Punchy Pops",
        min_main_steps=1,
        max_main_steps=2,
        allowed_main_kinds=_kinds("intervals", "build", "broken"),
        trigger_tags=frozenset({"speed", "sprints"}),
        routing_priority=60,
        allow_hypoxic_if_tagged=True,
        allow_underwater_if_tagged=True,
    ),
    "gear_change_up": ArchetypeContract(
        archetype_id="gear_change_up",
        display_name="Gear Change-Up",
        min_main_steps=2,
        max_main_steps=2,
        allowed_main_kinds=_kinds("intervals", "continuous", "build"),
        trigger_tags=frozenset({"fins", "pull", "paddles"}),
        routing_priority=20,
        allow_hypoxic_if_tagged=False,
        allow_underwater_if_tagged=False,
    ),
    "technique_refresh": ArchetypeContract(
        archetype_id="technique_refresh",
        display_name="Technique Refresh",
        min_main_steps=2,
        max_main_steps=4,
        allowed_main_kinds=_kinds("intervals", "continuous", "build"),
        trigger_tags=frozenset({"technique"}),
        routing_priority=10,
        allow_hypoxic_if_tagged=False,
        allow_underwater_if_tagged=False,
    ),
    "choice_session": ArchetypeContract(
        archetype_id="choice_session",
        display_name="Choice Session",
        min_main_steps=2,
        max_main_steps=3,
        allowed_main_kinds=_kinds("intervals", "continuous"),
        trigger_tags=frozenset({"choice"}),
        routing_priority=40,
        allow_hypoxic_if_tagged=False,
        allow_underwater_if_tagged=False,
    ),
    "benchmark_lite": ArchetypeContract(
        archetype_id="benchmark_lite",
        display_name="Benchmark Lite",
        min_main_steps=2,
        max_main_steps=3,
        allowed_main_kinds=_kinds("intervals", "build", "broken", "time_trial"),
        trigger_tags=frozenset({"time_trial", "golf", "benchmark"}),
        routing_priority=30,
        allow_hypoxic_if_tagged=False,
        allow_underwater_if_tagged=False,
    ),
}


DISPLAY_NAME_TO_ID: dict[str, ArchetypeId] = {
    contract.display_name.lower(): archetype_id
    for archetype_id, contract in ARCHETYPES.items()
}

