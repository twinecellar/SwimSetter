// Port of swim_planner_llm/llm_client_claude.py + wrapper.py
// Anthropic client is a module-level singleton — created once, reused across requests.

import Anthropic from '@anthropic-ai/sdk';
import type { LLMPlanDraft, SwimPlanInput, SwimPlanResponse } from './types';
import { SYSTEM_PROMPT, buildRepairPrompt, buildUserPrompt, summarizeHistory } from './prompt';
import { enforceAndNormalize, ValidationIssue, validateInvariants } from './validate';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.SWIM_PLANNER_CLAUDE_MODEL ?? 'claude-haiku-4-5-20251001';

// ── Markdown fence stripping (Claude sometimes wraps output in ``` fences) ────

function stripMarkdownFences(text: string): string {
  const stripped = text.trim();
  if (!stripped.startsWith('```')) return stripped;
  const firstNewline = stripped.indexOf('\n');
  if (firstNewline === -1) return stripped;
  let inner = stripped.slice(firstNewline + 1);
  if (inner.endsWith('```')) {
    inner = inner.slice(0, inner.lastIndexOf('```'));
  }
  return inner.trim();
}

// ── LLM call ──────────────────────────────────────────────────────────────────

async function claudeCompletion(system: string, user: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is missing');
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  if (!content) throw new ValidationIssue('Model returned empty response');
  return stripMarkdownFences(content);
}

// ── Parse + validate ──────────────────────────────────────────────────────────

function buildValidPlanFromLLM(rawText: string, payload: SwimPlanInput): SwimPlanResponse {
  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch (e: any) {
    throw new ValidationIssue(`json parse failed: ${e?.message ?? e}`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationIssue('llm output must be a single JSON object');
  }

  const draft = data as LLMPlanDraft;
  const plan = enforceAndNormalize(draft, payload.session_requested);
  validateInvariants(plan, payload.session_requested, payload.historic_sessions, payload.requested_tags);
  return plan;
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function generateSwimPlan(payload: SwimPlanInput): Promise<SwimPlanResponse> {
  const historySummary = summarizeHistory(payload.historic_sessions);
  const system = SYSTEM_PROMPT;
  const user = buildUserPrompt(payload, historySummary);

  let firstRaw = '';
  let firstError = '';

  // First attempt
  try {
    firstRaw = await claudeCompletion(system, user);
    return buildValidPlanFromLLM(firstRaw, payload);
  } catch (err: any) {
    firstError = err?.message ?? String(err);
  }

  // Repair attempt
  try {
    const repairUser = buildRepairPrompt(firstRaw || '<empty>', firstError);
    const repairRaw = await claudeCompletion(system, repairUser);
    return buildValidPlanFromLLM(repairRaw, payload);
  } catch (repairErr: any) {
    throw new ValidationIssue(
      `Plan generation failed after initial call and one repair attempt. ` +
        `Initial error: ${firstError}. Repair error: ${repairErr?.message ?? repairErr}`,
    );
  }
}
