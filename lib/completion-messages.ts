// lib/completion-messages.ts
// ─────────────────────────────────────────────────────────────
// Edit this file to add, remove, or change completion messages.
// Messages are selected based on effort and duration.
// Each array should have at least 3 entries.
// ─────────────────────────────────────────────────────────────
export const completionMessages = {
  // Shown when effort = 'easy' or tag includes 'recovery'
  easy: [
    "How was that?",
    "Gentle enough?",
    "Feel refreshed?",
    "Nice and easy?",
    "That felt good, right?",
    "Smooth session?",
    "Loosened up?",
    "Easy does it.",
    "Feeling limber?",
    "Just what you needed?",
    "Body feeling better?",
    "Nice and cruisy?",
    "Chill one today?",
    "Good to move?",
    "Shook the cobwebs off?",
  ],

  // Shown when effort = 'medium'
  medium: [
    "How was that?",
    "Solid effort?",
    "Worth it?",
    "Good session?",
    "How were the waves?",
    "Found your rhythm?",
    "Ticked the boxes?",
    "Feeling strong?",
    "Got the work in?",
    "Honest effort?",
    "That'll do nicely.",
    "Right in the sweet spot?",
    "Good honest swim?",
    "Kept it moving?",
    "Felt the burn a little?",
  ],

  // Shown when effort = 'hard'
  hard: [
    "Survived that?",
    "Legs still working?",
    "Gave it everything?",
    "Still breathing?",
    "Left it all in the pool?",
    "That one hurt, didn't it?",
    "Lungs still intact?",
    "Feel that lactic acid?",
    "Arms made of jelly yet?",
    "Everything hurting?",
    "Earned that shower.",
    "Did that set break you?",
    "Nothing left in the tank?",
    "Who hurt you? Oh right, you did.",
    "Gonna feel that tomorrow.",
  ],

  // Shown when duration <= 20 minutes (any effort)
  // Takes priority over effort messages for short sessions
  short: [
    "Quick dip?",
    "Fast and done?",
    "Twenty minutes well spent?",
    "In and out?",
    "Blink and you'd miss it.",
    "That was snappy.",
    "Brief but it counts.",
    "No messing about.",
    "Straight to business?",
    "Every minute counted?",
    "Flash swim.",
    "Efficient.",
  ],

  // Shown when duration >= 60 minutes (any effort)
  // Takes priority over effort messages for long sessions
  long: [
    "That was a long one.",
    "An hour well spent?",
    "Still got fingers?",
    "Properly done.",
    "That took commitment.",
    "Lost track of time?",
    "They almost closed up on you.",
    "Wrinkly yet?",
    "Could've watched a film in that time.",
    "Marathon session.",
    "You practically live there now.",
    "Did they charge you rent?",
    "That's dedication.",
    "Big session energy.",
    "Moved in, did you?",
  ],

  // Fallback — used if no session context is available
  fallback: [
    "Back on dry land?",
    "Towel off?",
    "Out of the pool?",
    "Dried off yet?",
    "How was it?",
    "Another one done.",
    "Chlorine never smelled so good?",
    "Land legs back?",
    "Good to be dry?",
    "Hair still wet?",
    "Goggles off?",
    "Cap's off, job's done.",
    "Back to reality.",
    "Swim complete.",
    "That's you done.",
  ],
} as const;

export type MessageCategory = keyof typeof completionMessages;

export const completionHeadings = [
  "Nice work.",
  "That's a session.",
  "Well done.",
  "Good swim.",
  "There it is.",
  "Nailed it.",
  "That counts.",
  "One more in the bank.",
  "Logged.",
  "Done and dusted.",
  "Boom.",
  "Solid.",
  "In the books.",
  "Another one down.",
  "You showed up.",
  "That's the stuff.",
] as const;