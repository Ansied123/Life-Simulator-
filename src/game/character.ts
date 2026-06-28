import type { Character, Stats, Effects, LogEntry } from './types';
import { randomGender, randomFirstName, randomLastName } from './names';
import { generateFamily, describeFamily } from './family';
import { randomBirthYear, randomBirthDate } from './calendar';
import { generateAddress } from './address';
import { applySchoolEffects } from './school';
import { adjustHappinessDelta } from './schoolTraits';

export { randomGender, randomFirstName, randomLastName };

function randStat(): number {
  // Bias toward the middle so most starts feel "average".
  return Math.round(30 + Math.random() * 50);
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export interface CharacterCreationInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  gender?: 'male' | 'female';
}

export function createCharacter(input: CharacterCreationInput = {}): Character {
  const gender = input.gender ?? randomGender();
  const first = input.firstName?.trim() || randomFirstName(gender);
  const last = input.lastName?.trim() || randomLastName();
  const middle = input.middleName?.trim();
  const suffix = input.suffix?.trim();
  const fullName = [first, middle, last, suffix].filter(Boolean).join(' ');

  const stats: Stats = {
    health: randStat(),
    happiness: randStat(),
    smarts: randStat(),
    looks: randStat(),
  };

  const relatives = generateFamily(last);
  const familyNote = describeFamily(relatives);
  const address = generateAddress();
  const birthText = `${fullName} was born a ${gender} baby. The family lives at ${address}.${familyNote ? ` ${familyNote}` : ''}`;

  const birthYear = randomBirthYear();
  const { month: birthMonth, day: birthDay } = randomBirthDate(birthYear);

  return {
    name: fullName,
    lastName: last,
    gender,
    age: 0,
    month: 0,
    alive: true,
    money: 0,
    job: null,
    stats,
    relatives,
    inventory: [],
    address,
    birthYear,
    birthMonth,
    birthDay,
    school: null,
    completedKindergarten: false,
    temperament: null,
    log: [{ age: 0, month: 0, text: birthText }],
  };
}

// Applies a set of effects to a character, returning a NEW character
// (we keep state immutable so React re-renders cleanly).
export function applyEffects(c: Character, effects: Effects): Character {
  const happinessDelta = c.school
    ? adjustHappinessDelta(effects.happiness ?? 0, c.temperament, c.school.culture, c.stats.health)
    : effects.happiness ?? 0;
  const stats: Stats = {
    health: clamp(c.stats.health + (effects.health ?? 0)),
    happiness: clamp(c.stats.happiness + happinessDelta),
    smarts: clamp(c.stats.smarts + (effects.smarts ?? 0)),
    looks: clamp(c.stats.looks + (effects.looks ?? 0)),
  };

  const log: LogEntry[] = effects.log
    ? [...c.log, { age: c.age, month: c.month, text: effects.log, kind: effects.logKind, detail: effects.detail }]
    : c.log;

  const relatives = effects.relativeEffects
    ? c.relatives.map((r) => {
        const match = effects.relativeEffects!.find((e) => e.relativeId === r.id);
        return match ? { ...r, relationship: clamp(r.relationship + match.relationship) } : r;
      })
    : c.relatives;

  const school = effects.schoolEffects || effects.classmateEffects ? applySchoolEffects(c, effects) : c.school;

  return {
    ...c,
    stats,
    relatives,
    school,
    money: c.money + (effects.money ?? 0),
    job: effects.job !== undefined ? effects.job : c.job,
    log,
  };
}
