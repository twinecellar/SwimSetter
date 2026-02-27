from __future__ import annotations

import hashlib
import json
import random
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid5

from .models import (
    HistoricSession,
    Section,
    Sections,
    SessionRequested,
    Step,
    SwimPlanInput,
    SwimPlanResponse,
)
from .style_inference import infer_prefer_varied_from_payload

NAMESPACE_DNS = UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
RISK_TAGS = {"pace-too-fast", "long", "tiring"}


def _round_to_multiple(value: int, multiple: int) -> int:
    if multiple <= 0:
        return value
    return max(multiple, int(round(value / multiple)) * multiple)


def _plan_distance(plan: dict) -> Optional[int]:
    distance = plan.get("estimated_distance_m")
    return distance if isinstance(distance, int) and distance > 0 else None


def _historical_ranges(history: list[HistoricSession]) -> tuple[list[int], list[int], bool]:
    ups: list[int] = []
    downs: list[int] = []
    risk_down = False

    for item in history:
        d = _plan_distance(item.session_plan or {})
        if item.thumb == 1:
            if d:
                ups.append(d)
        else:
            if d:
                downs.append(d)
            tags = {t.strip().lower() for t in item.tags}
            if tags.intersection(RISK_TAGS):
                risk_down = True
    return ups, downs, risk_down


def _base_target(req: SessionRequested) -> int:
    base = 650 if req.duration_minutes <= 20 else 950
    effort_offset = {"easy": -50, "medium": 0, "hard": 50}[req.effort]
    return max(300, base + effort_offset)


def _compute_target_distance(payload: SwimPlanInput) -> int:
    req = payload.session_requested
    ups, downs, _ = _historical_ranges(payload.historic_sessions)

    target = _base_target(req)
    if ups:
        lo, hi = min(ups), max(ups)
        target = min(max(target, lo), hi)

    risky_downs = [
        _plan_distance(item.session_plan or {})
        for item in payload.historic_sessions
        if item.thumb == 0
        and {t.strip().lower() for t in item.tags}.intersection(RISK_TAGS)
    ]
    risky_downs = [d for d in risky_downs if d]
    if risky_downs:
        target = min(target, max(400, min(risky_downs)))
    elif downs:
        target = min(target, max(downs))

    target = _round_to_multiple(target, 25)
    return max(300, target)


def _split_distance(total_m: int, pool_length: int) -> tuple[int, int, int]:
    warm = _round_to_multiple(int(total_m * 0.25), pool_length)
    main = _round_to_multiple(int(total_m * 0.60), pool_length)
    cool = total_m - warm - main
    cool = _round_to_multiple(cool, pool_length)
    adjusted_total = warm + main + cool
    if adjusted_total != total_m:
        main += total_m - adjusted_total
    return warm, main, cool


def _step(
    step_id: str,
    kind: str,
    reps: int,
    distance_per_rep_m: int,
    stroke: str,
    rest_seconds: Optional[int],
    effort: str,
    description: str,
) -> Step:
    return Step(
        step_id=step_id,
        kind=kind,
        reps=reps,
        distance_per_rep_m=distance_per_rep_m,
        stroke=stroke,
        rest_seconds=rest_seconds,
        effort=effort,
        description=description,
    )


def _main_steps(
    req: SessionRequested,
    main_dist: int,
    rng: random.Random,
    risk_down: bool,
    prefer_varied: bool,
) -> list[Step]:
    if req.effort == "hard" and not prefer_varied:
        rep_dist = 50 if main_dist % 50 == 0 else 25
        reps = max(1, main_dist // rep_dist)
        rest = 15 if not risk_down else 20
        return [
            _step(
                "main-1",
                "intervals",
                reps,
                rep_dist,
                "freestyle",
                rest,
                "hard",
                "High-intensity interval block",
            )
        ]

    if req.effort == "hard" and prefer_varied:
        if main_dist >= 200:
            first = _round_to_multiple(int(main_dist * 0.55), 25)
            second = main_dist - first
            second = max(25, _round_to_multiple(second, 25))
            first = main_dist - second
            return [
                _step(
                    "main-1",
                    "intervals",
                    max(1, first // 50),
                    50,
                    "freestyle",
                    20 if risk_down else 15,
                    "hard",
                    "Primary hard freestyle intervals",
                ),
                _step(
                    "main-2",
                    "intervals",
                    max(1, second // 25),
                    25,
                    rng.choice(["backstroke", "breaststroke", "choice", "mixed"]),
                    20,
                    "hard",
                    "Secondary hard varied intervals",
                ),
            ]

        return [
            _step(
                "main-1",
                "intervals",
                max(1, main_dist // 25),
                25,
                "mixed",
                20,
                "hard",
                "Compact varied hard interval set",
            )
        ]

    if not prefer_varied:
        if req.effort == "medium":
            rep_dist = 50 if main_dist % 50 == 0 else 25
            reps = max(1, main_dist // rep_dist)
            return [
                _step(
                    "main-1",
                    "intervals",
                    reps,
                    rep_dist,
                    "freestyle",
                    20,
                    "medium",
                    "Steady interval block",
                )
            ]

        return [
            _step(
                "main-1",
                "continuous",
                1,
                main_dist,
                "freestyle",
                None,
                "easy",
                "Continuous aerobic main block",
            )
        ]

    if req.effort == "medium" and main_dist >= 200:
        first = _round_to_multiple(int(main_dist * 0.5), 25)
        second = main_dist - first
        return [
            _step(
                "main-1",
                "intervals",
                max(1, first // 50),
                50,
                "mixed",
                20,
                "medium",
                "Mixed-stroke intervals",
            ),
            _step(
                "main-2",
                "intervals",
                max(1, second // 25),
                25,
                rng.choice(["backstroke", "breaststroke", "choice"]),
                20,
                "medium",
                "Technique-focused short intervals",
            ),
        ]

    if main_dist >= 100:
        first = _round_to_multiple(int(main_dist * 0.5), 25)
        first = max(25, first)
        second = max(25, main_dist - first)
        first = main_dist - second
        return [
            _step(
                "main-1",
                "intervals",
                max(1, first // 25),
                25,
                "mixed",
                20,
                req.effort,
                "Varied interval set (mixed emphasis)",
            ),
            _step(
                "main-2",
                "intervals",
                max(1, second // 25),
                25,
                rng.choice(["choice", "backstroke", "breaststroke"]),
                20,
                req.effort,
                "Varied interval set (stroke change)",
            ),
        ]

    return [
        _step(
            "main-1",
            "intervals",
            max(1, main_dist // 25),
            25,
            "choice",
            25,
            req.effort,
            "Compact varied interval set",
        )
    ]


def _seed_from_payload(payload: SwimPlanInput) -> int:
    digest = hashlib.sha256(payload.model_dump_json(sort_keys=True).encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def build_deterministic_fallback(payload: SwimPlanInput, seed: Optional[int]) -> SwimPlanResponse:
    real_seed = seed if seed is not None else _seed_from_payload(payload)
    rng = random.Random(real_seed)

    req = payload.session_requested
    prefer_varied = infer_prefer_varied_from_payload(payload)
    pool_length = 25
    target_distance = _compute_target_distance(payload)
    warm_dist, main_dist, cool_dist = _split_distance(target_distance, pool_length)

    _, _, risk_down = _historical_ranges(payload.historic_sessions)

    warm_steps = [
        _step("wu-1", "continuous", 1, warm_dist, "freestyle", None, "easy", "Easy warm-up")
    ]
    main_steps = _main_steps(req, main_dist, rng, risk_down, prefer_varied)
    cool_steps = [
        _step("cd-1", "continuous", 1, cool_dist, "choice", None, "easy", "Easy cool-down")
    ]

    sections = Sections(
        warm_up=Section(title="Warm-Up", section_distance_m=sum(s.step_distance_m for s in warm_steps), steps=warm_steps),
        main_set=Section(title="Main Set", section_distance_m=sum(s.step_distance_m for s in main_steps), steps=main_steps),
        cool_down=Section(title="Cool-Down", section_distance_m=sum(s.step_distance_m for s in cool_steps), steps=cool_steps),
    )

    estimated = (
        sections.warm_up.section_distance_m
        + sections.main_set.section_distance_m
        + sections.cool_down.section_distance_m
    )

    key = {
        "seed": real_seed,
        "request": req.model_dump(),
        "estimated_distance_m": estimated,
        "template": "fallback-v1",
    }
    plan_id = uuid5(NAMESPACE_DNS, json.dumps(key, sort_keys=True))
    created_at = datetime(2024, 1, 1, tzinfo=timezone.utc) + timedelta(seconds=real_seed % 86400)

    return SwimPlanResponse(
        plan_id=plan_id,
        created_at=created_at,
        duration_minutes=req.duration_minutes,
        estimated_distance_m=estimated,
        sections=sections,
    )
