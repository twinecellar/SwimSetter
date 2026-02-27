// Port of swim_planner_llm/wrapper.py + llm_client.py (_chat_completion only).
// OpenAI client is a module-level singleton — created once, reused across requests.

import OpenAI from 'openai';
import type { LLMPlanDraft, SwimPlanInput, SwimPlanResponse } from './types';
import { SYSTEM_PROMPT, buildRepairPrompt, buildUserPrompt, summarizeHistory } from './prompt';
import { enforceAndNormalize, ValidationIssue, validateInvariants } from './validate';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.SWIM_PLANNER_MODEL ?? 'gpt-4.1-mini';

// ── LLM call ──────────────────────────────────────────────────────────────────

async function chatCompletion(messages: { role: 'system' | 'user'; content: string }[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new ValidationIssue('Model returned empty response');
  return content;
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

  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildUserPrompt(payload, historySummary) },
  ];

  let firstRaw = '';
  let firstError = '';

  // First attempt
  try {
    firstRaw = await chatCompletion(messages);
    return buildValidPlanFromLLM(firstRaw, payload);
  } catch (err: any) {
    firstError = err?.message ?? String(err);
  }

  // Repair attempt
  try {
    const repairMessages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildRepairPrompt(firstRaw || '<empty>', firstError) },
    ];
    const repairRaw = await chatCompletion(repairMessages);
    return buildValidPlanFromLLM(repairRaw, payload);
  } catch (repairErr: any) {
    throw new ValidationIssue(
      `Plan generation failed after initial call and one repair attempt. ` +
        `Initial error: ${firstError}. Repair error: ${repairErr?.message ?? repairErr}`,
    );
  }
}
