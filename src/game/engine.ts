import type { Character, Relative } from './types';
import { clamp } from './character';

// Each year, stats drift naturally based on age. This is what makes a
// life feel like it has an arc even between scripted events.
export function naturalAging(c: Character): Character {
  const stats = { ...c.stats };

  // Health declines with age, faster after 50.
  if (c.age > 50) stats.health -= Math.floor((c.age - 50) / 5) + 1;
  else if (c.age > 30) stats.health -= 1;

  // Looks slowly fade after the late 20s.
  if (c.age > 28) stats.looks -= 1;

  // Clamp everything back into range.
  (Object.keys(stats) as (keyof typeof stats)[]).forEach((k) => {
    stats[k] = clamp(stats[k]);
  });

  return { ...c, stats };
}

// Returns a cause of death string if the character dies this year, else null.
export function rollDeath(c: Character): string | null {
  // Old age: chance climbs steeply past 70.
  if (c.age > 70) {
    const chance = (c.age - 70) * 0.03;
    if (Math.random() < chance) return 'old age';
  }
  // Very low health can be fatal at any age.
  if (c.stats.health <= 5 && Math.random() < 0.4) return 'poor health';
  // Hard cap.
  if (c.age >= 120) return 'extreme old age';
  return null;
}

// Same idea as rollDeath, but for relatives who don't have their own stats.
function rollRelativeDeath(age: number): string | null {
  if (age > 65) {
    const chance = (age - 65) * 0.025;
    if (Math.random() < chance) return 'old age';
  }
  if (age >= 100) return 'old age';
  // A small flat chance of an accident or illness at any age.
  if (Math.random() < 0.002) return 'an unexpected illness';
  return null;
}

const DEATH_HAPPINESS_PENALTY = 25;
// Relationship lost per year when a relative gets no attention at all.
const NEGLECT_DECAY = 5;

// Ages every living relative by a year: rolls for death, decays relationship
// when neglected, and resets this year's interaction flags either way.
export function ageRelatives(c: Character): Character {
  let log = c.log;
  let happinessPenalty = 0;

  const relatives: Relative[] = c.relatives.map((r) => {
    if (!r.alive) return r;
    const age = r.age + 1;
    const cause = rollRelativeDeath(age);

    if (cause) {
      happinessPenalty += DEATH_HAPPINESS_PENALTY;
      log = [...log, { age: c.age, text: `${r.name}, your ${r.role}, passed away at age ${age}.` }];
      return { ...r, age, alive: false, causeOfDeath: cause };
    }

    const neglected = !r.talkedThisYear && !r.spentTimeThisYear && !r.gaveMoneyThisYear;
    return {
      ...r,
      age,
      relationship: clamp(r.relationship - (neglected ? NEGLECT_DECAY : 0)),
      talkedThisYear: false,
      spentTimeThisYear: false,
      gaveMoneyThisYear: false,
    };
  });

  return {
    ...c,
    relatives,
    log,
    stats: { ...c.stats, happiness: clamp(c.stats.happiness - happinessPenalty) },
  };
}
