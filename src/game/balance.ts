// "Cap easy gains" — the further a 0-100 kindergarten-domain stat already is
// into its range (subjects, school record fields, classmate relationships),
// the less a single gain moves it. Only dampens gains; penalties pass
// through untouched. Deliberately scoped to school-domain stats, not the
// character's core 4 (health/happiness/smarts/looks), which operate at
// whole-of-life scope well beyond kindergarten.
export function diminishingReturnsMultiplier(currentValue: number): number {
  if (currentValue >= 90) return 0.5;
  if (currentValue >= 70) return 0.75;
  return 1;
}

export function applyDiminishingReturns(currentValue: number, delta: number): number {
  return delta > 0 ? delta * diminishingReturnsMultiplier(currentValue) : delta;
}

export const LOW_HEALTH_THRESHOLD = 30;
export const LOW_HAPPINESS_THRESHOLD = 30;

// "Low health matters": Study/Ask Parent gains -1, happiness gains dampened,
// and a monthly chance of an unrelated attendance dip (see
// applyLowHealthAttendanceDip in school.ts).
export function lowHealthStudyPenalty(health: number): number {
  return health <= LOW_HEALTH_THRESHOLD ? 1 : 0;
}

export function lowHealthHappinessGainMultiplier(health: number): number {
  return health <= LOW_HEALTH_THRESHOLD ? 0.7 : 1;
}

export const LOW_HEALTH_ATTENDANCE_DIP_CHANCE = 0.12;
export const LOW_HEALTH_ATTENDANCE_DIP_AMOUNT = 3;

// "Low happiness matters": Study/Ask Parent gains -1, behavior-risk chance on
// School Actions climbs, and classmate-interaction conflict chance climbs.
export function lowHappinessStudyPenalty(happiness: number): number {
  return happiness <= LOW_HAPPINESS_THRESHOLD ? 1 : 0;
}

export function lowHappinessRiskChanceMultiplier(happiness: number): number {
  return happiness <= LOW_HAPPINESS_THRESHOLD ? 1.25 : 1;
}

export function lowHappinessConflictChanceMultiplier(happiness: number): number {
  return happiness <= LOW_HAPPINESS_THRESHOLD ? 1.3 : 1;
}
