import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export interface SwimPlannerSessionRequested {
  duration_minutes: number;
  effort: "easy" | "medium" | "hard";
  requested_tags: string[];
}

export interface SwimPlannerHistoricSession {
  session_plan: {
    duration_minutes: number;
    estimated_distance_m: number;
  };
  thumb: 0 | 1;
  tags: string[];
}

export interface SwimPlannerPayload {
  session_requested: SwimPlannerSessionRequested;
  historic_sessions: SwimPlannerHistoricSession[];
  requested_tags: string[];
}

export interface SwimPlannerStep {
  step_id: string;
  kind: "continuous" | "intervals";
  reps: number;
  distance_per_rep_m: number;
  stroke: string;
  rest_seconds: number | null;
  effort: "easy" | "medium" | "hard";
  description: string;
}

export interface SwimPlannerSection {
  title: string;
  section_distance_m: number;
  steps: SwimPlannerStep[];
}

export interface SwimPlannerResponse {
  plan_id: string;
  created_at: string;
  duration_minutes: number;
  estimated_distance_m: number;
  sections: {
    warm_up: SwimPlannerSection;
    main_set: SwimPlannerSection;
    cool_down: SwimPlannerSection;
  };
}

function resolvePythonCommand(): string {
  const envOverride = process.env.SWIM_PLANNER_PYTHON;
  if (envOverride && envOverride.trim()) return envOverride.trim();

  const venvPython = path.join(process.cwd(), ".venv", "bin", "python");
  if (fs.existsSync(venvPython)) return venvPython;

  return "python3";
}

export async function runSwimPlannerLLM(
  payload: SwimPlannerPayload,
): Promise<SwimPlannerResponse> {
  const python = resolvePythonCommand();
  const entry = path.join(process.cwd(), "scripts", "swim_planner_llm_entry.py");

  return await new Promise((resolve, reject) => {
    const child = spawn(python, [entry], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      reject(
        new Error(
          `Failed to spawn python (${python}). ${err.message}`,
        ),
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `swim_planner_llm_entry exited with code ${code}. ${stderr || stdout}`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as SwimPlannerResponse;
        resolve(parsed);
      } catch (err: any) {
        reject(
          new Error(
            `Failed to parse swim_planner_llm output as JSON. ${err?.message ?? err}. stderr=${stderr}`,
          ),
        );
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

