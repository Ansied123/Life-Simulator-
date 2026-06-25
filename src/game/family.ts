import type { Character, Relative, RelativeRole } from './types';
import { randomGender, randomFirstName } from './names';

let nextId = 0;
function makeId(role: RelativeRole): string {
  nextId += 1;
  return `${role}-${nextId}-${Math.floor(Math.random() * 1e6)}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

// Below this age: the character can't interact with parents at all (their
// relationship just drifts passively), and siblings only get "Play" instead
// of the usual three options.
export const FAMILY_YOUNG_AGE_CUTOFF = 5;

// Shared by parents and full-time-employed siblings.
const ADULT_JOBS = [
  'Teacher', 'Nurse', 'Accountant', 'Truck Driver', 'Chef', 'Engineer', 'Police Officer',
  'Construction Worker', 'Retail Manager', 'Office Clerk', 'Mechanic', 'Sales Representative',
  'Electrician', 'Bus Driver', 'Software Developer', 'Plumber',
];
const PARENT_UNEMPLOYED_CHANCE = 0.2;

function randomParentJob(): string | null {
  if (Math.random() < PARENT_UNEMPLOYED_CHANCE) return null;
  return pick(ADULT_JOBS);
}

const PART_TIME_JOBS = [
  'Grocery Store Cashier', 'Movie Theater Usher', 'Pizza Delivery Driver', 'Babysitter',
  'Lifeguard', 'Retail Associate', 'Ice Cream Scooper', 'Dog Walker', 'Coffee Shop Barista', 'Tutor',
];
// Mirrors the player's own part-time (teen events) and full-time (adult events) job milestones.
const SIBLING_PART_TIME_AGE = 16;
const SIBLING_FULL_TIME_AGE = 20;

// Gives a sibling a job once they're old enough, upgrading a part-time job
// to full-time once they're old enough for that too.
export function maybeAssignSiblingJob(r: Relative): Relative {
  if (r.role !== 'sibling' || !r.alive) return r;
  const hasPartTimeJob = r.job?.startsWith('Part-Time');
  if (r.age >= SIBLING_FULL_TIME_AGE && (!r.job || hasPartTimeJob)) {
    return { ...r, job: `Full-Time ${pick(ADULT_JOBS)}` };
  }
  if (r.age >= SIBLING_PART_TIME_AGE && !r.job) {
    return { ...r, job: `Part-Time ${pick(PART_TIME_JOBS)}` };
  }
  return r;
}

function makeRelative(role: RelativeRole, gender: 'male' | 'female', age: number, lastName: string): Relative {
  const isParent = role === 'mother' || role === 'father';
  return {
    id: makeId(role),
    name: `${randomFirstName(gender)} ${lastName}`,
    role,
    gender,
    age,
    alive: true,
    relationship: 55 + Math.round(Math.random() * 25),
    married: isParent ? true : undefined,
    job: isParent ? randomParentJob() : undefined,
    talkedThisMonth: false,
    spentTimeThisMonth: false,
    gaveMoneyThisMonth: false,
    playedThisMonth: false,
  };
}

// Builds the new character's starting family: one or two parents, plus
// an optional handful of siblings already born before the character.
export function generateFamily(lastName: string): Relative[] {
  const relatives: Relative[] = [];

  if (Math.random() < 0.08) {
    // Small chance of a single-parent household.
    const gender = randomGender();
    relatives.push(makeRelative(gender === 'male' ? 'father' : 'mother', gender, 24 + Math.floor(Math.random() * 18), lastName));
  } else {
    relatives.push(makeRelative('mother', 'female', 24 + Math.floor(Math.random() * 16), lastName));
    relatives.push(makeRelative('father', 'male', 25 + Math.floor(Math.random() * 18), lastName));
  }

  if (Math.random() > 0.45) {
    const siblingCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < siblingCount; i++) {
      relatives.push(makeRelative('sibling', randomGender(), 1 + Math.floor(Math.random() * 10), lastName));
    }
  }

  return relatives;
}

const SIBLING_CHANCE_PER_YEAR = 0.12;
const PARENT_FERTILE_MIN_AGE = 20;
const PARENT_FERTILE_MAX_AGE = 45;

function rollNewbornCount(): number {
  const roll = Math.random();
  if (roll < 0.88) return 1;
  if (roll < 0.98) return 2; // twins
  return 3; // triplets
}

// Each year, if both parents are alive, married, and of an appropriate age,
// there's a small chance the household grows with 1-3 new siblings.
export function rollAdditionalSiblings(c: Character): Character {
  const mother = c.relatives.find((r) => r.role === 'mother' && r.alive);
  const father = c.relatives.find((r) => r.role === 'father' && r.alive);
  if (!mother || !father || !mother.married || !father.married) return c;

  const inFertileRange = (r: Relative) => r.age >= PARENT_FERTILE_MIN_AGE && r.age <= PARENT_FERTILE_MAX_AGE;
  if (!inFertileRange(mother) || !inFertileRange(father)) return c;
  if (Math.random() >= SIBLING_CHANCE_PER_YEAR) return c;

  const count = rollNewbornCount();
  const newborns = Array.from({ length: count }, () => makeRelative('sibling', randomGender(), 0, c.lastName));
  const names = newborns.map((s) => s.name).join(', ');
  const log = [
    ...c.log,
    {
      age: c.age,
      month: c.month,
      text:
        count === 1
          ? `Your parents welcomed a new sibling into the family: ${names}.`
          : `Your parents welcomed new siblings into the family: ${names}.`,
    },
  ];

  return { ...c, relatives: [...c.relatives, ...newborns], log };
}

// ===== Family interactions =====

const PARENT_INTERACTION_FAIL_CHANCE = 0.1;
const SIBLING_INTERACTION_FAIL_CHANCE = 0.3;
// Rebalanced down from the old once-a-year deltas now that every action is
// usable every month (age 5+) instead of once a year — 12x the opportunities
// called for noticeably smaller per-use amounts, not the same amounts 12x over.
const FAMILY_INTERACTION_FAIL_DELTA = -3;

const FAMILY_CONFLICT_REASONS = [
  'Got into an argument over something silly.',
  'Brought up an old disagreement at the wrong time.',
  'Felt too busy to really pay attention.',
  'Misunderstood what you meant and got upset.',
  'Was in a bad mood and snapped at you.',
  'Disagreed about how to spend the time together.',
  'Got distracted and seemed uninterested.',
  'Took something you said the wrong way.',
  'Was stressed about something else and took it out on you.',
  'Ended up bickering over something unimportant.',
];

const YOUNG_SIBLING_PLAY_FAIL_REASONS = [
  'Got upset when the game did not go their way.',
  'Started crying after losing a toy tug-of-war.',
  'Got cranky and refused to keep playing.',
  'Threw a tantrum over whose turn it was.',
  'Got too rough and someone ended up in tears.',
  'Got bored and wandered off mid-game.',
];

export interface FamilyInteractionResult {
  relationshipDelta: number;
  happinessDelta: number;
  moneyDelta: number;
  logText: string;
  // Set only when the interaction's fail chance triggers; shown to the player.
  conflictReason: string | null;
}

// Even a well-meaning gesture can land badly. Parents are generally more
// forgiving (10% fail chance) than siblings, who bicker more easily (30%).
// 'play' is the sole option for siblings under FAMILY_YOUNG_AGE_CUTOFF.
// `moneyAmount` is the amount a 'giveMoney' attempt would hand over on
// success; on failure, nothing changes hands.
export function rollFamilyInteraction(
  action: 'talk' | 'spendTime' | 'giveMoney' | 'play',
  relative: Relative,
  moneyAmount: number
): FamilyInteractionResult {
  const base = {
    talk: { relationship: 2, happiness: 1, log: `Talked with ${relative.name}.` },
    spendTime: { relationship: 4, happiness: 2, log: `Spent quality time with ${relative.name}.` },
    giveMoney: { relationship: 6, happiness: 1, log: `Gave $${moneyAmount} to ${relative.name}.` },
    play: { relationship: 4, happiness: 2, log: `Played with ${relative.name}.` },
  }[action];

  const isParent = relative.role === 'mother' || relative.role === 'father';
  const failChance = isParent ? PARENT_INTERACTION_FAIL_CHANCE : SIBLING_INTERACTION_FAIL_CHANCE;

  if (Math.random() < failChance) {
    const reasons = action === 'play' ? YOUNG_SIBLING_PLAY_FAIL_REASONS : FAMILY_CONFLICT_REASONS;
    return {
      relationshipDelta: FAMILY_INTERACTION_FAIL_DELTA,
      happinessDelta: -1,
      moneyDelta: 0,
      logText: `Had a falling-out with ${relative.name}.`,
      conflictReason: pick(reasons),
    };
  }

  return {
    relationshipDelta: base.relationship,
    happinessDelta: base.happiness,
    moneyDelta: action === 'giveMoney' ? -moneyAmount : 0,
    logText: base.log,
    conflictReason: null,
  };
}

const FAMILY_NEGLECT_DECAY = 1;
// A parent relationship the character can't yet act on still wanders a
// little on its own each tick, instead of sitting frozen or only decaying.
const PASSIVE_PARENT_DRIFT_RANGE = 2; // +/- this much

// Resets every relative's monthly interaction flags, decaying relationship
// for anyone who got no attention at all this tick. Parents are exempt while
// the character is too young to interact with them (FAMILY_YOUNG_AGE_CUTOFF)
// — their relationship drifts passively up or down instead. Runs every
// month at age 5+, or every year (the only granularity available) below it.
export function tickFamilyMonthly(c: Character): Character {
  const tooYoungForParents = c.age < FAMILY_YOUNG_AGE_CUTOFF;

  const relatives = c.relatives.map((r) => {
    if (!r.alive) return r;
    const isParent = r.role === 'mother' || r.role === 'father';

    if (isParent && tooYoungForParents) {
      const drift = Math.round(Math.random() * (PASSIVE_PARENT_DRIFT_RANGE * 2)) - PASSIVE_PARENT_DRIFT_RANGE;
      return { ...r, relationship: clamp(r.relationship + drift) };
    }

    const neglected = !r.talkedThisMonth && !r.spentTimeThisMonth && !r.gaveMoneyThisMonth && !r.playedThisMonth;
    return {
      ...r,
      relationship: clamp(r.relationship - (neglected ? FAMILY_NEGLECT_DECAY : 0)),
      talkedThisMonth: false,
      spentTimeThisMonth: false,
      gaveMoneyThisMonth: false,
      playedThisMonth: false,
    };
  });

  return { ...c, relatives };
}

// A short sentence for the age-0 log entry, naming each relative and their age.
export function describeFamily(relatives: Relative[]): string {
  const parents = relatives.filter((r) => r.role === 'mother' || r.role === 'father');
  const siblings = relatives.filter((r) => r.role === 'sibling');
  const parts: string[] = [];

  if (parents.length === 2) {
    parts.push(`Parents: ${parents.map((p) => `${p.name} (${p.age})`).join(' and ')}.`);
  } else if (parents.length === 1) {
    parts.push(`Parent: ${parents[0].name} (${parents[0].age}).`);
  }

  if (siblings.length === 1) {
    parts.push(`Sibling: ${siblings[0].name} (${siblings[0].age}).`);
  } else if (siblings.length > 1) {
    parts.push(`Siblings: ${siblings.map((s) => `${s.name} (${s.age})`).join(', ')}.`);
  }

  return parts.join(' ');
}
