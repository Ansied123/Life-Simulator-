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
  // A short log of life events, newest last.
  log: LogEntry[];
}

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
  promotionStatus: string;
}

export interface LogEntry {
  age: number;
  // Months since the character's last birthday (0-11) when this entry was logged.
  month: number;
  text: string;
  // 'major' = bolded (deaths, etc.); 'self' = lighter (the player's own routine actions).
  kind?: 'major' | 'self';
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
  relationship: number; // 0-100; status label is derived from this
  playedThisMonth: boolean;
  sharedToyThisMonth: boolean;
  talkedThisMonth: boolean;
}
export type ClassmateStatus = 'Bully' | 'Rival' | 'Classmate' | 'Friend' | 'Best Friend';

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
}

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
  // Styling hint for the log entry above; see LogEntry.kind.
  logKind?: LogEntry['kind'];
  // Relationship deltas applied to specific relatives, by id.
  relativeEffects?: { relativeId: string; relationship: number }[];
  // Relationship deltas applied to specific classmates, by id.
  classmateEffects?: { classmateId: string; relationship: number }[];
  // Deltas applied to the character's school record, if they're enrolled.
  schoolEffects?: {
    attendance?: number;
    behavior?: number;
    socialProgress?: number;
    teacherRelationship?: number;
    subjects?: Partial<Record<SchoolSubject, number>>;
  };
}

export interface Choice {
  text: string;       // Button label shown to the player
  effects: Effects;   // What happens if chosen
  // Optional flavor shown after choosing, before effects are summarized.
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
