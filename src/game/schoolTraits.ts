import type { SchoolSubject, Temperament, SchoolCulture } from './types';
import { applyDiminishingReturns, lowHealthHappinessGainMultiplier } from './balance';

export const TEMPERAMENTS: Temperament[] = ['Curious', 'Shy', 'Energetic', 'Sensitive', 'Bold'];
export const SCHOOL_CULTURES: SchoolCulture[] = [
  'Academic-Focused',
  'Play-Based',
  'Strict Discipline',
  'Creative Environment',
  'Underfunded',
  'Elite Reputation',
];

export const TEMPERAMENT_INFO: Record<Temperament, { label: string; description: string }> = {
  Curious: { label: 'Curious Child', description: 'Learns fast and asks a lot of questions — sometimes too many.' },
  Shy: { label: 'Shy Child', description: 'Opens up slowly with classmates, but teachers warm to the quiet focus.' },
  Energetic: { label: 'Energetic Child', description: 'Thrives on the move — PE and play come easy, sitting still does not.' },
  Sensitive: { label: 'Sensitive Child', description: 'Feels every high and low a little more intensely.' },
  Bold: { label: 'Bold Child', description: 'Makes friends fast and takes more chances doing it.' },
};

export const SCHOOL_CULTURE_INFO: Record<SchoolCulture, { tagline: string }> = {
  'Academic-Focused': { tagline: 'This school pushes early learning.' },
  'Play-Based': { tagline: 'This school believes kids learn through play.' },
  'Strict Discipline': { tagline: 'This school expects children to follow rules.' },
  'Creative Environment': { tagline: 'This school encourages art, music, and imagination.' },
  Underfunded: { tagline: 'The school is doing its best with limited resources.' },
  'Elite Reputation': { tagline: 'Parents in the district care a lot about this school.' },
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomTemperament(): Temperament {
  return pick(TEMPERAMENTS);
}

export function randomSchoolCulture(): SchoolCulture {
  return pick(SCHOOL_CULTURES);
}

// Only scales positive ("gain") deltas; penalties pass through unchanged —
// matches how every trait bullet is phrased ("social gains -25%", etc.).
function scaleGain(value: number, multiplier: number): number {
  return value > 0 ? value * multiplier : value;
}

function temperamentSocialMultiplier(t: Temperament | null): number {
  if (t === 'Shy') return 0.75;
  if (t === 'Energetic') return 1.25;
  return 1;
}

function temperamentBoldRiskMultiplier(t: Temperament | null): number {
  return t === 'Bold' ? 1.2 : 1;
}

// Flat bonus added to a successful classmate-relationship gain.
export function temperamentClassmateRelationshipBonus(t: Temperament | null): number {
  return t === 'Bold' ? 2 : 0;
}

// Shared by classmate Play/Talk/Share Toy gains.
export function temperamentClassmateSocialMultiplier(t: Temperament | null): number {
  return temperamentSocialMultiplier(t);
}

// Flat bonus added to Study / Ask Parent for Help's subject gain.
export function temperamentStudyBonus(t: Temperament | null): number {
  return t === 'Curious' ? 2 : 0;
}

// Flat penalty subtracted from Study / Ask Parent for Help's subject gain.
export function cultureStudyDelta(culture: SchoolCulture): number {
  return culture === 'Play-Based' ? -1 : 0;
}

// Bold is generally more likely to backfire on risky School Actions; Curious
// specifically more likely to backfire on question/attention-seeking ones.
export function temperamentRiskChanceMultiplier(actionId: string, t: Temperament | null): number {
  let mult = temperamentBoldRiskMultiplier(t);
  if (t === 'Curious' && (actionId === 'raise_hand' || actionId === 'ask_question')) mult *= 1.3;
  return mult;
}

// Bold is also more likely to trigger a classmate-interaction falling-out.
export function temperamentConflictChanceMultiplier(t: Temperament | null): number {
  return temperamentBoldRiskMultiplier(t);
}

// Shy kids take a playground falling-out harder.
export function temperamentConflictHappinessDelta(t: Temperament | null): number {
  return t === 'Shy' ? -3 : -2;
}

export function adjustHappinessDelta(
  delta: number,
  temperament: Temperament | null,
  culture: SchoolCulture,
  health: number
): number {
  if (delta === 0) return 0;
  let value = delta;
  if (temperament === 'Sensitive') value *= 1.25; // swings both ways, harder
  value = scaleGain(value, culture === 'Play-Based' ? 1.1 : 1);
  value = scaleGain(value, lowHealthHappinessGainMultiplier(health));
  return Math.round(value);
}

export function adjustSubjectDelta(
  subject: SchoolSubject,
  delta: number,
  temperament: Temperament | null,
  culture: SchoolCulture,
  currentValue: number
): number {
  if (delta <= 0) return delta;
  let value = delta;
  if (culture === 'Academic-Focused') value *= 1.1;
  if (culture === 'Creative Environment' && (subject === 'Art' || subject === 'Music')) value *= 1.15;
  if (temperament === 'Energetic') {
    if (subject === 'PE') value *= 1.25;
    if (subject === 'Listening Skills') value *= 0.8;
  }
  value = applyDiminishingReturns(currentValue, value);
  return Math.round(value);
}

export function adjustSchoolDelta(
  field: 'behavior' | 'teacherRelationship' | 'socialProgress' | 'attendance',
  delta: number,
  temperament: Temperament | null,
  culture: SchoolCulture,
  currentValue: number
): number {
  if (delta === 0) return 0;
  let value = delta;

  if (field === 'socialProgress') {
    value = scaleGain(value, temperamentSocialMultiplier(temperament));
    value = scaleGain(value, culture === 'Play-Based' ? 1.1 : 1);
  }
  if (field === 'teacherRelationship') {
    if (temperament === 'Shy') value = scaleGain(value, 1.2);
    if (culture === 'Strict Discipline') value *= 1.2; // matters more, both ways
    if (culture === 'Underfunded') value = scaleGain(value, 0.85);
  }
  if (field === 'behavior') {
    if (temperament === 'Energetic' && value < 0) value -= 2;
    if (culture === 'Strict Discipline' && value < 0) value *= 1.3;
  }

  value = applyDiminishingReturns(currentValue, value);
  return Math.round(value);
}

// Underfunded schools can't put on field trips/talent shows as often;
// Creative Environment schools lean into art- and music-flavored events.
export function cultureEventWeightMultiplier(templateId: string, culture: SchoolCulture): number {
  if (culture === 'Underfunded' && (templateId === 'field_trip_zoo' || templateId === 'talent_show')) return 0.4;
  if (culture === 'Creative Environment' && (templateId === 'coloring_contest' || templateId === 'talent_show')) return 1.6;
  return 1;
}

// Elite Reputation parents react more strongly to how their kid is doing.
export function cultureSatisfactionSwingMultiplier(culture: SchoolCulture): number {
  return culture === 'Elite Reputation' ? 1.3 : 1;
}
