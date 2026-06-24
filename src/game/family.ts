import type { Relative, RelativeRole } from './types';
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
