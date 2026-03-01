// lib/get-completion-message.ts

import { completionMessages, completionHeadings } from './completion-messages';

interface SessionContext {
  effort: 'easy' | 'medium' | 'hard';
  duration_minutes: number;
  tags?: string[];
}

function pickRandom(messages: readonly string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getCompletionMessage(session?: SessionContext): string {
  if (!session) {
    return pickRandom(completionMessages.fallback);
  }

  const { effort, duration_minutes, tags = [] } = session;

  // Duration takes priority — short and long sessions
  // override effort-based selection
  if (duration_minutes <= 20) {
    return pickRandom(completionMessages.short);
  }

  if (duration_minutes >= 60) {
    return pickRandom(completionMessages.long);
  }

  // Recovery tag overrides effort level
  if (tags.map(t => t.toLowerCase()).includes('recovery')) {
    return pickRandom(completionMessages.easy);
  }

  // Effort-based selection
  return pickRandom(completionMessages[effort] ?? completionMessages.fallback);
}

export function getCompletionHeading(): string {
  return pickRandom(completionHeadings);
}
