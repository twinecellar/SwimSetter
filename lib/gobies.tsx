// ── Goby species types and data ───────────────────────────────────────────────

export type GobySpecies =
  | 'neon'
  | 'sand'
  | 'ghost'
  | 'bumblebee'
  | 'clown'
  | 'sleeper'
  | 'mudskipper'
  | 'rhinogobius'
  | 'peacock'
  | 'dwarf';

// Mapping from swim_level → GobySpecies assigned during onboarding.
// Only neon, sand, and ghost are used here; the rest are reserved for future assignment.
// TODO (future feature): After sufficient session history is accumulated, re-evaluate the
// user's goby species based on their session preferences, effort levels, and tag patterns.
// The assignment logic will live in a separate resolveGobySpecies(sessions) function.
export const GOBY_BY_LEVEL: Record<string, GobySpecies> = {
  advanced:     'neon',
  intermediate: 'sand',
  beginner:     'ghost',
};

export const GOBY_PROFILES: Record<GobySpecies, { name: string; species: string; descriptor: string }> = {
  neon: {
    name:       'The Neon',
    species:    'Elacatinus oceanops',
    descriptor: 'Fast, focused, built for speed. You know your way around a set.',
  },
  sand: {
    name:       'The Sand Goby',
    species:    'Pomatoschistus minutus',
    descriptor: 'Consistent and capable. You turn up, get it done, and enjoy it.',
  },
  ghost: {
    name:       'The Ghost',
    species:    'Fusigobius pallidus',
    descriptor: "New to the deep end? That's fine. We'll figure it out together.",
  },
  bumblebee:   { name: 'The Bumblebee',   species: 'Brachygobius doriae',     descriptor: '' },
  clown:       { name: 'The Clown',        species: 'Valenciennea puellaris',   descriptor: '' },
  sleeper:     { name: 'The Sleeper',      species: 'Dormitator maculatus',     descriptor: '' },
  mudskipper:  { name: 'The Mudskipper',   species: 'Periophthalmus modestus',  descriptor: '' },
  rhinogobius: { name: 'The Rhinogobius',  species: 'Rhinogobius duospilus',    descriptor: '' },
  peacock:     { name: 'The Peacock',      species: 'Ptereleotris evides',      descriptor: '' },
  dwarf:       { name: 'The Dwarf',        species: 'Trimma caesiura',          descriptor: '' },
};

// ── SVG fish components ───────────────────────────────────────────────────────

type GobyFishProps = { width?: number; height?: number };

// Neon Goby — Elacatinus oceanops
// Dark navy body with a bright cyan lateral stripe; swift and sleek.
export function NeonGobyFish({ width = 160, height = 100 }: GobyFishProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="38" cy="25" rx="26" ry="13" fill="#1A2840" />
      <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#1A2840" />
      <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
      <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
      {/* Neon lateral stripe */}
      <path d="M16 23 Q38 21 65 24" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M30 20 C33 18, 36 18, 38 20" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#0F1C2E" />
    </svg>
  );
}

// Sand Goby — Pomatoschistus minutus
// Warm sandy-tan body; dependable and consistent.
export function SandGobyFish({ width = 160, height = 100 }: GobyFishProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="38" cy="25" rx="26" ry="13" fill="#C8A878" />
      <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#C8A878" />
      <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
      <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
      <path d="M30 20 C33 18, 36 18, 38 20" stroke="#A88060" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#A88060" />
      {/* Subtle mottling */}
      <ellipse cx="35" cy="26" rx="3" ry="2" fill="#B49060" opacity="0.35" />
      <ellipse cx="48" cy="24" rx="2.5" ry="1.5" fill="#B49060" opacity="0.25" />
    </svg>
  );
}

// Ghost Goby — Fusigobius pallidus
// Very pale, almost translucent; quietly finds its way.
export function GhostGobyFish({ width = 160, height = 100 }: GobyFishProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="38" cy="25" rx="26" ry="13" fill="#D8D0E0" />
      <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#C8C0D4" />
      <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
      <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
      <path d="M30 20 C33 18, 36 18, 38 20" stroke="#B8B0C8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#C0B8D0" />
    </svg>
  );
}

// Base Goby — yellow, used as placeholder for unillustrated species
export function BaseGobyFish({ width = 160, height = 100 }: GobyFishProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="38" cy="25" rx="26" ry="13" fill="#F5C800" />
      <path d="M64 25 C72 15, 78 12, 76 25 C78 38, 72 35, 64 25Z" fill="#F5C800" />
      <ellipse cx="20" cy="22" rx="3.5" ry="3.5" fill="#1A1A2A" />
      <ellipse cx="21" cy="21" rx="1.2" ry="1.2" fill="white" />
      <path d="M30 20 C33 18, 36 18, 38 20" stroke="#D4A900" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12 25 C8 20, 4 18, 6 25 C4 32, 8 30, 12 25Z" fill="#D4A900" />
    </svg>
  );
}

export const GOBY_FISH_COMPONENTS: Record<GobySpecies, React.ComponentType<GobyFishProps>> = {
  neon:        NeonGobyFish,
  sand:        SandGobyFish,
  ghost:       GhostGobyFish,
  bumblebee:   BaseGobyFish,
  clown:       BaseGobyFish,
  sleeper:     BaseGobyFish,
  mudskipper:  BaseGobyFish,
  rhinogobius: BaseGobyFish,
  peacock:     BaseGobyFish,
  dwarf:       BaseGobyFish,
};
