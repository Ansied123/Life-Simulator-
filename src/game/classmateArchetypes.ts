import type { ClassmateArchetype } from './types';

export const CLASSMATE_ARCHETYPES: ClassmateArchetype[] = ['Bossy', 'Quiet', 'Wild', 'Sweet', 'Popular', 'Tough'];

export const ARCHETYPE_INFO: Record<ClassmateArchetype, { label: string; description: string }> = {
  Bossy: { label: 'The Bossy Kid', description: 'Likes things their way — but once you win them over, they talk you up to everyone.' },
  Quiet: { label: 'The Quiet Kid', description: 'Opens up more through conversation than rough-and-tumble play.' },
  Wild: { label: 'The Wild Kid', description: 'Play with them is a blast, but it can get out of hand.' },
  Sweet: { label: 'The Sweet Kid', description: 'Easygoing and generous — hard to get into a fight with.' },
  Popular: { label: 'The Popular Kid', description: 'Everyone wants their attention, so it takes more to stand out — but it pays off big once you do.' },
  Tough: { label: 'The Tough Kid', description: 'Starts out prickly and quick to clash, but might surprise you.' },
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomArchetype(): ClassmateArchetype {
  return pick(CLASSMATE_ARCHETYPES);
}

// Tough kids start out already prickly instead of the usual 25-75 roll.
export function archetypeStartingRelationship(archetype: ClassmateArchetype): number | null {
  return archetype === 'Tough' ? 5 + Math.floor(Math.random() * 20) : null;
}

// "Talk works better" for Quiet, "Play works worse"; "Share Toy works
// better" for Sweet. Applies to both the relationship and social deltas of
// that specific action.
export function archetypeActionMultiplier(archetype: ClassmateArchetype | undefined, action: 'play' | 'shareToy' | 'talk'): number {
  if (archetype === 'Quiet') {
    if (action === 'talk') return 1.3;
    if (action === 'play') return 0.7;
  }
  if (archetype === 'Sweet' && action === 'shareToy') return 1.3;
  return 1;
}

// "Relationship gains slower" for Bossy/Popular.
export function archetypeRelationshipMultiplier(archetype: ClassmateArchetype | undefined): number {
  if (archetype === 'Bossy') return 0.8;
  if (archetype === 'Popular') return 0.7;
  return 1;
}

// "Play gives bigger happiness" for Wild.
export function archetypeHappinessMultiplier(archetype: ClassmateArchetype | undefined, action: 'play' | 'shareToy' | 'talk'): number {
  return archetype === 'Wild' && action === 'play' ? 1.5 : 1;
}

// "Conflict chance lower" for Sweet; "more likely to start playground
// conflict" for Bossy/Tough.
export function archetypeConflictChanceMultiplier(archetype: ClassmateArchetype | undefined): number {
  if (archetype === 'Sweet') return 0.6;
  if (archetype === 'Bossy') return 1.2;
  if (archetype === 'Tough') return 1.5;
  return 1;
}

// "Falling out hurts social progress more" for Popular.
export function archetypeConflictSocialPenaltyMultiplier(archetype: ClassmateArchetype | undefined): number {
  return archetype === 'Popular' ? 1.5 : 1;
}

// "High relationship boosts social progress a lot" for Bossy/Popular —
// once you've actually won them over, it shows.
export function archetypeHighRelationshipSocialBonus(archetype: ClassmateArchetype | undefined, relationship: number): number {
  if (relationship < 70) return 0;
  if (archetype === 'Bossy') return 2;
  if (archetype === 'Popular') return 3;
  return 0;
}

// "Behavior risks increase when interacting" for Wild.
export const WILD_BEHAVIOR_RISK_CHANCE = 0.25;
export function archetypeBehaviorRiskChance(archetype: ClassmateArchetype | undefined): number {
  return archetype === 'Wild' ? WILD_BEHAVIOR_RISK_CHANCE : 0;
}

// "Becoming best friends gives smarts +1 occasionally" for Quiet.
export const QUIET_BEST_FRIEND_SMARTS_CHANCE = 0.5;
export function archetypeBestFriendSmartsChance(archetype: ClassmateArchetype | undefined): number {
  return archetype === 'Quiet' ? QUIET_BEST_FRIEND_SMARTS_CHANCE : 0;
}

// "More likely to start playground conflict" (Bossy/Tough) / "conflict
// chance lower" (Sweet) for the random playground_conflict event specifically.
export function archetypeConflictEventWeightMultiplier(archetype: ClassmateArchetype | undefined): number {
  if (archetype === 'Tough') return 1.8;
  if (archetype === 'Bossy') return 1.4;
  if (archetype === 'Sweet') return 0.5;
  return 1;
}
