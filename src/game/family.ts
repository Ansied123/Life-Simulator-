import type { Character, Relative, RelativeRole } from './types';
import { randomGender, randomFirstName } from './names';

let nextId = 0;
function makeId(role: RelativeRole): string {
  nextId += 1;
  return `${role}-${nextId}-${Math.floor(Math.random() * 1e6)}`;
}

function makeRelative(role: RelativeRole, gender: 'male' | 'female', age: number, lastName: string): Relative {
  return {
    id: makeId(role),
    name: `${randomFirstName(gender)} ${lastName}`,
    role,
    gender,
    age,
    alive: true,
    relationship: 55 + Math.round(Math.random() * 25),
    married: role === 'mother' || role === 'father' ? true : undefined,
    talkedThisYear: false,
    spentTimeThisYear: false,
    gaveMoneyThisYear: false,
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
      text:
        count === 1
          ? `Your parents welcomed a new sibling into the family: ${names}.`
          : `Your parents welcomed new siblings into the family: ${names}.`,
    },
  ];

  return { ...c, relatives: [...c.relatives, ...newborns], log };
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
