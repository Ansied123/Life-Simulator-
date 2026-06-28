// ===== Core data models =====

export type StatKey = 'health' | 'happiness' | 'smarts' | 'looks';

export interface Stats {
  health: number;   // 0-100
  happiness: number;
  smarts: number;
  looks: number;
}

export interface Character {
  name: string;
  lastName: string;
  gender: 'male' | 'female';
  age: number;
  // Months since the last birthday (0-11). Only relevant once monthly mode
  // kicks in at MONTHLY_MODE_MIN_AGE; resets to 0 every time age increments.
  month: number;
  alive: boolean;
  causeOfDeath?: string;
  money: number;
  job: string | null;
  stats: Stats;
  relatives: Relative[];
  inventory: Item[];
  address: string;
  birthYear: number;
  birthMonth: number; // 1-12
  birthDay: number;
  school: School | null;
  // Once kindergarten has been finished (or dropped out of) for any reason,
  // it's not offered again.
  completedKindergarten: boolean;
  // Generated once at kindergarten enrollment; colors how school-related
  // actions and events play out. Null before enrollment.
  temperament: Temperament | null;
  // A short log of life events, newest last.
  log: LogEntry[];
}

// A hidden-ish personality trait generated at kindergarten enrollment; see
// game/schoolTraits.ts for what each one actually changes mechanically.
export type Temperament = 'Curious' | 'Shy' | 'Energetic' | 'Sensitive' | 'Bold';

export interface Item {
  id: string;
  name: string;
  icon: string;
  description?: string;
  acquiredAge: number;
  // Marks items that open a custom detail view (e.g. a progress report) when tapped in the inventory.
  kind?: 'progressReport';
  progressReport?: ProgressReportData;
}

// Snapshot of a school record, captured at the moment a school cycle ends.
export interface ProgressReportData {
  schoolName: string;
  teacherName: string;
  overallLearning: number; // 0-100
  behavior: number; // 0-100
  socialProgress: number; // 0-100
  attendance: number; // 0-100
  teacherComment: string;
  awards: string[]; // names of awards earned during the cycle
  goalsCompleted: string[]; // labels of this year's goals that were met
  promotionStatus: string;
}

export interface LogEntry {
  age: number;
  // Months since the character's last birthday (0-11) when this entry was logged.
  month: number;
  text: string;
  // 'major' = bolded (deaths, etc.); 'self' = lighter (the player's own routine actions).
  kind?: 'major' | 'self';
  // An optional second line shown under the same entry (e.g. the flavor text
  // that follows a life-event choice), styled the same as the main line.
  detail?: string;
}

// ===== Family =====

export type RelativeRole = 'mother' | 'father' | 'sibling';

export interface Relative {
  id: string;
  name: string;
  role: RelativeRole;
  gender: 'male' | 'female';
  age: number;
  alive: boolean;
  causeOfDeath?: string;
  relationship: number; // 0-100
  // Only meaningful for mother/father; whether they're married to the other parent.
  married?: boolean;
  // Only meaningful for mother/father; null means unemployed.
  job?: string | null;
  // Whether each interaction has already been used this month (age 5+) or
  // this year (under 5, the only granularity that exists then).
  talkedThisMonth: boolean;
  spentTimeThisMonth: boolean;
  gaveMoneyThisMonth: boolean;
  // Only meaningful for siblings under FAMILY_YOUNG_AGE_CUTOFF, whose only
  // available interaction is "Play".
  playedThisMonth: boolean;
}

// ===== School =====

export type SchoolLevel = 'Kindergarten';
export type Grade = 'K';
export type SchoolType = 'Public' | 'Private' | 'Charter' | 'Montessori' | 'Religious';
export type TeacherPersonality = 'Kind' | 'Strict' | 'Funny' | 'Patient' | 'Serious' | 'Energetic';
// Generated once per school; see game/schoolTraits.ts for what each one
// changes mechanically.
export type SchoolCulture =
  | 'Academic-Focused'
  | 'Play-Based'
  | 'Strict Discipline'
  | 'Creative Environment'
  | 'Underfunded'
  | 'Elite Reputation';

export const SCHOOL_SUBJECTS = [
  'Reading Readiness',
  'Counting & Numbers',
  'Shapes & Colors',
  'Writing Letters',
  'Listening Skills',
  'Sharing & Cooperation',
  'Art',
  'Music',
  'PE',
] as const;
export type SchoolSubject = (typeof SCHOOL_SUBJECTS)[number];

export interface Teacher {
  name: string; // includes the Mr./Mrs./Ms. prefix
  personality: TeacherPersonality; // hidden from the player; nudges value changes
}

export interface Classmate {
  id: string;
  name: string;
  // Fixed personality assigned at generation; see game/classmateArchetypes.ts
  // for what it actually changes mechanically. Distinct from ClassmateStatus
  // below, which is just a label derived live from relationship.
  archetype: ClassmateArchetype;
  relationship: number; // 0-100; status label is derived from this
  playedThisMonth: boolean;
  sharedToyThisMonth: boolean;
  talkedThisMonth: boolean;
}
export type ClassmateStatus = 'Bully' | 'Rival' | 'Classmate' | 'Friend' | 'Best Friend';
export type ClassmateArchetype = 'Bossy' | 'Quiet' | 'Wild' | 'Sweet' | 'Popular' | 'Tough';

export type ParentTeacherMeetingStatus =
  | 'Not Yet Scheduled'
  | 'Meeting Went Well'
  | 'Meeting Was Tense'
  | 'Meeting Missed';

export interface School {
  level: SchoolLevel;
  grade: Grade;
  name: string;
  district: string;
  type: SchoolType;
  culture: SchoolCulture;
  classroom: string;
  teacher: Teacher;
  // The character's age/month at the moment of enrollment, used to compute
  // months-since-enrollment (the school year runs September-May, which
  // rarely lines up with the character's own birthday).
  enrolledAge: number;
  enrolledMonth: number;
  classmates: Classmate[];
  attendance: number; // 0-100
  behavior: number; // 0-100; label derived
  socialProgress: number; // 0-100; label derived
  teacherRelationship: number; // 0-100; label derived
  subjects: Record<SchoolSubject, number>; // 0-100 each; overall learning progress is their average
  // Whether each subject has already been studied this month.
  subjectsStudiedThisMonth: Record<SchoolSubject, boolean>;
  // IDs of "School Actions" already performed this month.
  actionsUsedThisMonth: string[];
  // IDs of school awards already earned this cycle.
  awardsEarned: string[];
  // 0-100; how much the parents help out with school, driven by family
  // relationships, parent jobs, and random events.
  parentHelpLevel: number;
  // 0-100; how the parents feel about how their kid is doing in school.
  parentSatisfaction: number;
  parentTeacherMeetingStatus: ParentTeacherMeetingStatus;
  // Remaining monthly "energy" for school-related actions (study, school
  // actions, classmate interactions, asking a parent for help, resting).
  // Resets to MAX_FOCUS_POINTS every month — forces the player to choose
  // rather than doing everything available in a single month.
  focusPoints: number;
  // How many of the teacher's 2 personality hints have been revealed to the
  // player so far this enrollment (0-2); see game/school.ts TEACHER_HINTS.
  teacherHintsRevealed: number;
  // 2-3 goals generated at enrollment for this school year; see
  // game/school.ts SCHOOL_GOALS for what each one actually checks.
  goalIds: SchoolGoalId[];
  // Consecutive months a withdrawal-risk condition has been true; resets to
  // 0 the moment things improve. See maybeWithdrawFromKindergarten.
  withdrawalRiskStreak: number;
  // Set the moment the talent show's "Get stage fright" choice is picked;
  // feeds the Kindergarten Stage Fright milestone memory.
  hadStageFright: boolean;
  // Counts classmate-interaction falling-outs with a Bully-status or Tough
  // classmate; feeds the Playground Bully Memory milestone memory.
  bullyConflictCount: number;
}

// A 2-3 month-long target generated at enrollment; see game/school.ts
// SCHOOL_GOALS for the actual completion check behind each one.
export type SchoolGoalId =
  | 'make_friend'
  | 'reading_target'
  | 'behavior_target'
  | 'teacher_relationship_target'
  | 'earn_award'
  | 'social_target'
  | 'attendance_target';

// ===== Events =====

// Effects an outcome applies to the character.
export interface Effects {
  health?: number;
  happiness?: number;
  smarts?: number;
  looks?: number;
  money?: number;
  job?: string | null;
  // Free-text line appended to the life log when this outcome happens.
  log?: string;
  // Optional second line attached to the same log entry; see LogEntry.detail.
  detail?: string;
  // Styling hint for the log entry above; see LogEntry.kind.
  logKind?: LogEntry['kind'];
  // Relationship deltas applied to specific relatives, by id.
  relativeEffects?: { relativeId: string; relationship: number }[];
  // Relationship deltas applied to specific classmates, by id. `minRelationship`
  // guarantees a floor (e.g. a "you're best friends now" event), applied
  // after the additive delta above.
  classmateEffects?: { classmateId: string; relationship: number; minRelationship?: number }[];
  // Deltas applied to the character's school record, if they're enrolled.
  schoolEffects?: {
    attendance?: number;
    behavior?: number;
    socialProgress?: number;
    teacherRelationship?: number;
    subjects?: Partial<Record<SchoolSubject, number>>;
    parentSatisfaction?: number;
    parentHelpLevel?: number;
  };
}

export interface Choice {
  text: string;       // Button label shown to the player
  effects: Effects;   // What happens if chosen
  // Optional flavor text shown as a second line on the same log entry.
  result?: string;
}

export interface GameEvent {
  id: string;
  // Decides whether this event is eligible for the current character.
  condition: (c: Character) => boolean;
  // The situation text shown to the player.
  text: (c: Character) => string;
  // 1+ choices. A single "Continue" choice = a non-interactive event.
  choices: Choice[];
  // Higher weight = more likely to be picked among eligible events.
  weight?: number;
  // If true, the event can only fire once per playthrough.
  once?: boolean;
}
