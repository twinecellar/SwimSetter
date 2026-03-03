import type { SwimPlanInput, StepKind } from "../types";
import type { ArchetypeContract, BlueprintV2, SectionBlueprint } from "./types";

function sb(steps: number, ...allowed: ReadonlySet<StepKind>[]): SectionBlueprint {
  if (allowed.length !== steps) {
    throw new Error("allowed kinds must be provided for each step position");
  }
  return { steps, allowed_kinds_by_step: allowed };
}

function same(steps: number, allowed: ReadonlySet<StepKind>): ReadonlySet<StepKind>[] {
  return Array.from({ length: steps }, () => allowed);
}

export function buildBlueprintV2(archetype: ArchetypeContract, payload: SwimPlanInput): BlueprintV2 {
  const effort = payload.session_requested.effort;
  const duration = payload.session_requested.duration_minutes;
  const level = payload.session_requested.swim_level;
  const requestedTags = new Set(
    [
      ...(payload.session_requested.requested_tags ?? []),
      ...(payload.requested_tags ?? []),
    ]
      .map((t) => (t ?? "").toString().trim().toLowerCase())
      .filter(Boolean),
  );

  // Warm-up / cool-down intentionally stable for readability.
  const warm =
    effort === "hard"
      ? sb(2, new Set<StepKind>(["continuous"]), new Set<StepKind>(["intervals"]))
      : sb(1, new Set<StepKind>(["continuous"]));
  const cool = sb(1, new Set<StepKind>(["continuous"]));

  const archetypeId = archetype.archetype_id;
  let main: SectionBlueprint;

  if (archetypeId === "flow_reset") {
    const mainSteps = effort === "hard" && duration >= 25 ? 2 : 1;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "cruise_builder") {
    const mainSteps = duration >= 35 ? 3 : 2;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "playful_alternator") {
    const mainSteps = duration >= 30 ? 2 : 1;
    if (mainSteps === 1) {
      main = sb(1, new Set<StepKind>(["intervals"]));
    } else {
      main = sb(2, new Set<StepKind>(["intervals"]), new Set<StepKind>(["continuous"]));
    }
  } else if (archetypeId === "mini_block_roulette") {
    let mainSteps = duration >= 35 ? 4 : 3;
    if (level === "beginner") mainSteps = 3;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "stroke_switch_ladder") {
    const mainSteps = duration >= 35 ? 2 : 1;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "punchy_pops") {
    let mainSteps = duration >= 30 ? 2 : 1;
    if (level === "beginner") mainSteps = 1;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "gear_change_up") {
    main = sb(2, ...same(2, archetype.allowed_main_kinds));
  } else if (archetypeId === "technique_refresh") {
    let mainSteps = 2;
    if (level === "advanced" && duration >= 35) mainSteps = 3;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "choice_session") {
    const mainSteps = duration < 35 ? 2 : 3;
    main = sb(mainSteps, ...same(mainSteps, archetype.allowed_main_kinds));
  } else if (archetypeId === "benchmark_lite") {
    const steadyKinds = new Set<StepKind>(["intervals", "build"]);
    const challengeKinds = requestedTags.has("golf")
      ? new Set<StepKind>(["intervals"])
      : new Set<StepKind>(["broken", "time_trial"]);
    if (duration < 35) {
      main = sb(3, steadyKinds, challengeKinds, steadyKinds);
    } else {
      main = sb(4, steadyKinds, steadyKinds, challengeKinds, steadyKinds);
    }
  } else {
    main = sb(archetype.min_main_steps, ...same(archetype.min_main_steps, archetype.allowed_main_kinds));
  }

  return { warm_up: warm, main_set: main, cool_down: cool };
}
