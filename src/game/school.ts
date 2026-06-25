import type {
  Character,
  Classmate,
  ClassmateStatus,
  Effects,
  Item,
  ParentTeacherMeetingStatus,
  ProgressReportData,
  Relative,
  School,
  SchoolSubject,
  SchoolType,
  Teacher,
  TeacherPersonality,
} from './types';
import { SCHOOL_SUBJECTS } from './types';
import { randomGender, randomFirstName, randomLastName } from './names';
import { currentCalendarMonth } from './calendar';

// A child must already be 5 by the September enrollment date; one born
// later in the year (e.g. October) waits for the following September.
export const SCHOOL_START_AGE = 5;
const KINDERGARTEN_START_MONTH = 9; // September
const KINDERGARTEN_END_MONTH = 5; // May

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 20 name roots x 5 suffixes = 100 distinct school names.
const SCHOOL_NAME_ROOTS = [
  'Lincoln', 'Washington', 'Roosevelt', 'Jefferson', 'Sunnyvale', 'Maple Grove', 'Riverside', 'Oakwood',
  'Lakeside', 'Hillcrest', 'Meadowbrook', 'Cedar Ridge', 'Willow Creek', 'Greenfield', 'Fairview', 'Brookside',
  'Pinecrest', 'Sunset', 'Valley View', 'Eastwood',
];
const SCHOOL_NAME_SUFFIXES = ['Elementary School', 'Elementary', 'Academy', 'Primary School', 'Learning Center'];

const DISTRICT_WORDS = [
  'Maple', 'Oak', 'Cedar', 'Highland', 'Riverside', 'Liberty', 'Union', 'Franklin',
  'Lakeview', 'Hillside', 'Meadowlands', 'Brookfield', 'Eastgate', 'Westfield', 'Northbrook', 'Southport',
];
const DISTRICT_SUFFIXES = ['School District', 'Unified School District', 'County School District'];

const CLASSROOM_THEMES = [
  'Sunflower', 'Rainbow', 'Caterpillar', 'Butterfly', 'Star', 'Moon', 'Bumblebee', 'Ladybug',
  'Puppy', 'Panda', 'Penguin', 'Owl', 'Fox', 'Bear', 'Dolphin',
];

const SCHOOL_TYPE_WEIGHTS: { type: SchoolType; weight: number }[] = [
  { type: 'Public', weight: 60 },
  { type: 'Private', weight: 15 },
  { type: 'Charter', weight: 10 },
  { type: 'Montessori', weight: 10 },
  { type: 'Religious', weight: 5 },
];

const TEACHER_PERSONALITIES: TeacherPersonality[] = ['Kind', 'Strict', 'Funny', 'Patient', 'Serious', 'Energetic'];

// How strongly a teacher's hidden personality nudges behavior/teacher-relationship
// deltas. Values above 1 amplify swings (both good and bad); below 1 soften them.
export const PERSONALITY_MODIFIERS: Record<TeacherPersonality, { behavior: number; teacherRelationship: number }> = {
  Kind: { behavior: 1, teacherRelationship: 1.3 },
  Strict: { behavior: 1.4, teacherRelationship: 0.7 },
  Funny: { behavior: 1, teacherRelationship: 1.15 },
  Patient: { behavior: 0.7, teacherRelationship: 1.1 },
  Serious: { behavior: 1.2, teacherRelationship: 0.85 },
  Energetic: { behavior: 1.1, teacherRelationship: 1.1 },
};

function randomSchoolName(): string {
  return `${pick(SCHOOL_NAME_ROOTS)} ${pick(SCHOOL_NAME_SUFFIXES)}`;
}

function randomDistrict(): string {
  return `${pick(DISTRICT_WORDS)} ${pick(DISTRICT_SUFFIXES)}`;
}

function randomClassroom(): string {
  if (Math.random() < 0.4) return `Room ${1 + Math.floor(Math.random() * 20)}`;
  return `The ${pick(CLASSROOM_THEMES)} Room`;
}

function randomSchoolType(): SchoolType {
  const total = SCHOOL_TYPE_WEIGHTS.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * total;
  for (const t of SCHOOL_TYPE_WEIGHTS) {
    roll -= t.weight;
    if (roll <= 0) return t.type;
  }
  return SCHOOL_TYPE_WEIGHTS[SCHOOL_TYPE_WEIGHTS.length - 1].type;
}

function randomTeacher(): Teacher {
  const gender = randomGender();
  const prefix = gender === 'male' ? 'Mr.' : pick(['Mrs.', 'Ms.']);
  return {
    name: `${prefix} ${randomLastName()}`,
    personality: pick(TEACHER_PERSONALITIES),
  };
}

function makeClassmate(): Classmate {
  const gender = randomGender();
  return {
    id: `classmate-${Math.floor(Math.random() * 1e9)}`,
    name: randomFirstName(gender),
    relationship: 25 + Math.round(Math.random() * 50),
    playedThisMonth: false,
    sharedToyThisMonth: false,
    talkedThisMonth: false,
  };
}

// Starting subject scores scale with the character's smarts: a 0-smarts kid
// starts around 0, a 100-smarts kid starts around 40, each with a little jitter.
function initialSubjects(smarts: number): Record<SchoolSubject, number> {
  const base = Math.round((smarts / 100) * 40);
  const subjects = {} as Record<SchoolSubject, number>;
  for (const s of SCHOOL_SUBJECTS) {
    const jitter = Math.round(Math.random() * 10 - 5);
    subjects[s] = clamp(base + jitter, 0, 40);
  }
  return subjects;
}

function freshStudyFlags(): Record<SchoolSubject, boolean> {
  const flags = {} as Record<SchoolSubject, boolean>;
  for (const s of SCHOOL_SUBJECTS) flags[s] = false;
  return flags;
}

// Baseline parent help level from family relationships + whether the
// parents have jobs; random events nudge it further on a monthly basis.
function computeParentHelpBaseline(relatives: Relative[]): number {
  const parents = relatives.filter((r) => (r.role === 'mother' || r.role === 'father') && r.alive);
  if (parents.length === 0) return 25;
  const avgRelationship = parents.reduce((sum, p) => sum + p.relationship, 0) / parents.length;
  const jobBonus = parents.filter((p) => p.job).length * 8;
  return clamp(Math.round(avgRelationship * 0.6 + jobBonus));
}

function generateSchool(smarts: number, relatives: Relative[], enrolledAge: number, enrolledMonth: number): School {
  const classmateCount = 8 + Math.floor(Math.random() * 3); // 8-10
  return {
    level: 'Kindergarten',
    grade: 'K',
    name: randomSchoolName(),
    district: randomDistrict(),
    type: randomSchoolType(),
    classroom: randomClassroom(),
    teacher: randomTeacher(),
    enrolledAge,
    enrolledMonth,
    classmates: Array.from({ length: classmateCount }, makeClassmate),
    attendance: 100,
    behavior: 100,
    socialProgress: 50,
    teacherRelationship: 50,
    subjects: initialSubjects(smarts),
    subjectsStudiedThisMonth: freshStudyFlags(),
    actionsUsedThisMonth: [],
    awardsEarned: [],
    parentHelpLevel: computeParentHelpBaseline(relatives),
    parentSatisfaction: 65,
    parentTeacherMeetingStatus: 'Not Yet Scheduled',
  };
}

// Number of full months that have passed since enrollment, accounting for
// the character's own age/month possibly wrapping past a birthday since.
function monthsSinceEnrollment(c: Character): number {
  if (!c.school) return 0;
  return (c.age - c.school.enrolledAge) * 12 + (c.month - c.school.enrolledMonth);
}

// Kindergarten always starts in September, and a child must already be
// SCHOOL_START_AGE by then — checked every month so a child who turns 5
// after September (e.g. in October) enrolls the following September instead.
export function maybeEnrollInSchool(c: Character): Character {
  if (c.school || c.completedKindergarten || c.age < SCHOOL_START_AGE) return c;
  if (currentCalendarMonth(c.birthMonth, c.month) !== KINDERGARTEN_START_MONTH) return c;
  const school = generateSchool(c.stats.smarts, c.relatives, c.age, c.month);
  return {
    ...c,
    school,
    log: [...c.log, { age: c.age, month: c.month, text: `Started kindergarten at ${school.name}!` }],
  };
}

// Resets every classmate's, subject's, and school action's per-month flags.
// Called whenever a month passes, whether or not it also wraps into a new age.
export function resetMonthlySchoolFlags(c: Character): Character {
  if (!c.school) return c;
  return {
    ...c,
    school: {
      ...c.school,
      classmates: c.school.classmates.map((cm) => ({
        ...cm,
        playedThisMonth: false,
        sharedToyThisMonth: false,
        talkedThisMonth: false,
      })),
      subjectsStudiedThisMonth: freshStudyFlags(),
      actionsUsedThisMonth: [],
    },
  };
}

const AUTO_DROPOUT_GRACE_MONTHS = 3;
const AUTO_DROPOUT_VERY_LOW = 10;
const AUTO_DROPOUT_CHANCE = 0.25;

// Permanently removes the character from school, whatever the reason.
// Kindergarten isn't offered again afterward, by dropout or otherwise.
export function dropOutOfSchool(c: Character, reason = 'Dropped out of kindergarten.'): Character {
  return {
    ...c,
    school: null,
    completedKindergarten: true,
    log: [...c.log, { age: c.age, month: c.month, text: reason, kind: 'major' }],
  };
}

// At least AUTO_DROPOUT_GRACE_MONTHS into kindergarten, sustained very-low
// academic stats OR very-low social progress each carry a per-month chance
// of an automatic drop-out.
export function maybeAutoDropOut(c: Character): Character {
  if (!c.school || monthsSinceEnrollment(c) < AUTO_DROPOUT_GRACE_MONTHS) return c;
  const s = c.school;
  const academicCrisis =
    s.attendance <= AUTO_DROPOUT_VERY_LOW ||
    s.behavior <= AUTO_DROPOUT_VERY_LOW ||
    overallLearningProgress(s) <= AUTO_DROPOUT_VERY_LOW ||
    s.teacherRelationship <= AUTO_DROPOUT_VERY_LOW;
  const socialCrisis = s.socialProgress <= AUTO_DROPOUT_VERY_LOW;

  if (!academicCrisis && !socialCrisis) return c;
  if (Math.random() >= AUTO_DROPOUT_CHANCE) return c;

  return dropOutOfSchool(
    c,
    socialCrisis && !academicCrisis
      ? 'Withdrawn from kindergarten after struggling to fit in socially.'
      : 'Withdrawn from kindergarten after falling too far behind.'
  );
}

export function overallLearningProgress(school: School): number {
  const values = SCHOOL_SUBJECTS.map((s) => school.subjects[s]);
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function behaviorLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Okay';
  if (score >= 20) return 'Poor';
  return 'Trouble';
}

export function learningLabel(score: number): string {
  if (score >= 80) return 'Advanced';
  if (score >= 60) return 'On Track';
  if (score >= 40) return 'Developing';
  if (score >= 20) return 'Needs Practice';
  return 'Struggling';
}

export function socialLabel(score: number): string {
  if (score >= 80) return 'Class Favorite';
  if (score >= 60) return 'Popular';
  if (score >= 40) return 'Friendly';
  if (score >= 20) return 'Quiet';
  return 'Shy';
}

export function teacherRelationshipLabel(score: number): string {
  if (score >= 85) return 'Favorite Student';
  if (score >= 55) return 'Likes You';
  if (score >= 30) return 'Neutral';
  return 'Dislikes You';
}

export function classmateStatusLabel(score: number): ClassmateStatus {
  if (score >= 80) return 'Best Friend';
  if (score >= 60) return 'Friend';
  if (score >= 40) return 'Classmate';
  if (score >= 20) return 'Rival';
  return 'Bully';
}

export function parentHelpLevelLabel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 70) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

export function parentSatisfactionLabel(score: number): 'Proud' | 'Neutral' | 'Concerned' | 'Upset' {
  if (score >= 75) return 'Proud';
  if (score >= 50) return 'Neutral';
  if (score >= 25) return 'Concerned';
  return 'Upset';
}

// How much a parent's current satisfaction buffs (or dampens) relationship
// gains from interacting with them, in the family section.
export function parentSatisfactionRelationshipMultiplier(score: number): number {
  if (score >= 75) return 1.3;
  if (score >= 50) return 1;
  if (score >= 25) return 0.8;
  return 0.6;
}

// Applies schoolEffects + classmateEffects to a character's school record,
// running behavior/teacher-relationship deltas through the teacher's hidden
// personality modifier first.
export function applySchoolEffects(c: Character, effects: Effects): School | null {
  if (!c.school) return c.school;
  let school = c.school;

  if (effects.schoolEffects) {
    const se = effects.schoolEffects;
    const mods = PERSONALITY_MODIFIERS[school.teacher.personality];
    const subjects = { ...school.subjects };
    if (se.subjects) {
      for (const [subject, delta] of Object.entries(se.subjects) as [SchoolSubject, number][]) {
        subjects[subject] = clamp(subjects[subject] + delta);
      }
    }
    school = {
      ...school,
      attendance: clamp(school.attendance + (se.attendance ?? 0)),
      behavior: clamp(school.behavior + Math.round((se.behavior ?? 0) * mods.behavior)),
      socialProgress: clamp(school.socialProgress + (se.socialProgress ?? 0)),
      teacherRelationship: clamp(school.teacherRelationship + Math.round((se.teacherRelationship ?? 0) * mods.teacherRelationship)),
      subjects,
    };
  }

  if (effects.classmateEffects) {
    const ce = effects.classmateEffects;
    school = {
      ...school,
      classmates: school.classmates.map((cm) => {
        const match = ce.find((e) => e.classmateId === cm.id);
        return match ? { ...cm, relationship: clamp(cm.relationship + match.relationship) } : cm;
      }),
    };
  }

  return school;
}

// ===== Awards =====

export interface SchoolAward {
  id: string;
  name: string;
  icon: string;
  description: string;
  // Months into the cycle before this award can first be earned (default 0).
  minMonth?: number;
  requirement: (school: School) => boolean;
}

export const SCHOOL_AWARDS: SchoolAward[] = [
  {
    id: 'perfect_attendance',
    name: 'Perfect Attendance',
    icon: '📅',
    description: 'Maintained perfect attendance at school.',
    minMonth: 2,
    requirement: (s) => s.attendance >= 100,
  },
  {
    id: 'student_of_the_month',
    name: 'Student of the Month',
    icon: '🌟',
    description: 'Recognized for excellent behavior, learning, and teacher relationship.',
    requirement: (s) => s.behavior >= 80 && s.teacherRelationship >= 80 && overallLearningProgress(s) >= 60,
  },
  {
    id: 'best_helper',
    name: 'Best Helper',
    icon: '🧽',
    description: 'Always the first to lend the teacher a hand.',
    requirement: (s) => s.teacherRelationship >= 90,
  },
  {
    id: 'best_listener',
    name: 'Best Listener',
    icon: '👂',
    description: 'Always listens carefully and follows directions.',
    // Behavior also starts at 100, so this needs the same sustained-effort gate as
    // Perfect Attendance — otherwise it'd be handed out for free on day one.
    minMonth: 2,
    requirement: (s) => s.behavior >= 95,
  },
  {
    id: 'most_creative',
    name: 'Most Creative',
    icon: '🎨',
    description: 'Stood out for imaginative art and music.',
    requirement: (s) => s.subjects['Art'] >= 75 || s.subjects['Music'] >= 75,
  },
  {
    id: 'kindness_award',
    name: 'Kindness Award',
    icon: '💛',
    description: 'Known across the classroom for kindness to every classmate.',
    requirement: (s) => s.socialProgress >= 85,
  },
  {
    id: 'reading_star',
    name: 'Reading Star',
    icon: '📖',
    description: 'Mastered early reading skills ahead of the class.',
    requirement: (s) => s.subjects['Reading Readiness'] >= 85,
  },
  {
    id: 'counting_star',
    name: 'Counting Star',
    icon: '🔢',
    description: 'Mastered early counting and number skills.',
    requirement: (s) => s.subjects['Counting & Numbers'] >= 85,
  },
  {
    id: 'great_friend_award',
    name: 'Great Friend Award',
    icon: '🤝',
    description: 'Formed an unbreakable bond with a classmate.',
    requirement: (s) => s.classmates.some((cm) => cm.relationship >= 95),
  },
];

// Checks every kindergarten award the character hasn't already earned, and
// grants any newly-qualifying ones as inventory items.
export function checkSchoolAwards(c: Character): Character {
  if (!c.school) return c;
  const school = c.school;
  const newlyEarned = SCHOOL_AWARDS.filter(
    (a) => !school.awardsEarned.includes(a.id) && monthsSinceEnrollment(c) >= (a.minMonth ?? 0) && a.requirement(school)
  );
  if (newlyEarned.length === 0) return c;

  const earnedItems: Item[] = newlyEarned.map((a) => ({
    id: `award-${a.id}`,
    name: a.name,
    icon: a.icon,
    description: a.description,
    acquiredAge: c.age,
  }));

  return {
    ...c,
    inventory: [...c.inventory, ...earnedItems],
    log: [
      ...c.log,
      ...newlyEarned.map((a) => ({ age: c.age, month: c.month, text: `Earned the "${a.name}" award at school!`, kind: 'major' as const })),
    ],
    school: { ...school, awardsEarned: [...school.awardsEarned, ...newlyEarned.map((a) => a.id)] },
  };
}

// ===== End of kindergarten: progress report =====

const PROMOTION_LEARNING_THRESHOLD = 40; // "Developing" on the learning-progress scale

function teacherComment(school: School, promoted: boolean): string {
  if (promoted && school.behavior >= 80 && school.socialProgress >= 70) {
    return `${school.teacher.name} writes: "A joy to have in class — ready for Grade 1!"`;
  }
  if (promoted) {
    return `${school.teacher.name} writes: "Made steady progress this year and is ready to move on."`;
  }
  if (school.behavior <= 30) {
    return `${school.teacher.name} writes: "Needs another year to work on behavior and focus."`;
  }
  return `${school.teacher.name} writes: "Could use another year to catch up before first grade."`;
}

// Every May, the kindergarten cycle ends regardless of the child's exact
// age at that point: they receive a progress report summarizing the year,
// and leave the school.
export function maybeEndKindergarten(c: Character): Character {
  if (!c.school || currentCalendarMonth(c.birthMonth, c.month) !== KINDERGARTEN_END_MONTH) return c;
  const school = c.school;
  const learning = overallLearningProgress(school);
  const promoted = learning >= PROMOTION_LEARNING_THRESHOLD;

  const report: ProgressReportData = {
    schoolName: school.name,
    teacherName: school.teacher.name,
    overallLearning: learning,
    behavior: school.behavior,
    socialProgress: school.socialProgress,
    attendance: school.attendance,
    teacherComment: teacherComment(school, promoted),
    awards: school.awardsEarned.map((id) => SCHOOL_AWARDS.find((a) => a.id === id)?.name ?? id),
    promotionStatus: promoted ? 'Promoted to Grade 1' : 'Recommended to Repeat Kindergarten',
  };

  const reportItem: Item = {
    id: 'kindergarten_progress_report',
    name: 'Kindergarten Progress Report',
    icon: '📋',
    description: promoted ? 'Promoted to Grade 1.' : 'Recommended to repeat kindergarten.',
    acquiredAge: c.age,
    kind: 'progressReport',
    progressReport: report,
  };

  return {
    ...c,
    school: null,
    completedKindergarten: true,
    inventory: [...c.inventory, reportItem],
    log: [
      ...c.log,
      {
        age: c.age,
        month: c.month,
        text: promoted
          ? 'Finished kindergarten and was promoted to Grade 1!'
          : 'Finished kindergarten but will need to repeat the year.',
        kind: 'major',
      },
    ],
  };
}

// ===== Classmate interactions =====

const CLASSMATE_CONFLICT_RELATIONSHIP_DELTA = -10;

// Better-looking kids have an easier time socially: the usual 20% conflict
// chance only applies in the 60-79 range, dropping to 10% above 80 and
// climbing 5% for every 10 points below 60.
export function classmateInteractionFailChance(looks: number): number {
  if (looks >= 80) return 0.1;
  if (looks >= 60) return 0.2;
  if (looks >= 50) return 0.25;
  if (looks >= 40) return 0.3;
  if (looks >= 30) return 0.35;
  if (looks >= 20) return 0.4;
  if (looks >= 10) return 0.45;
  return 0.5;
}

const CLASSMATE_CONFLICT_REASONS = [
  'Got into an argument over whose turn it was.',
  'Accidentally knocked over their block tower.',
  'Disagreed about the rules of the game.',
  'Got a little too competitive and hurt their feelings.',
  'Said something that came out meaner than intended.',
  'Refused to share the favorite crayon.',
  'Got jealous and said something unkind.',
  'Bumped into them too hard while playing tag.',
  'Laughed at the wrong moment and hurt their feelings.',
  "Couldn't agree on who would be the line leader.",
];

export interface ClassmateInteractionResult {
  relationshipDelta: number;
  socialDelta: number;
  happinessDelta: number;
  logText: string;
  // Set only when the 20% chance of a conflict triggers; shown to the player.
  conflictReason: string | null;
}

// Even a friendly interaction has a chance of going sideways — less so for
// good-looking kids. Picks the deltas to apply and, on a conflict, a reason
// to show the player.
export function rollClassmateInteraction(
  action: 'play' | 'shareToy' | 'talk',
  classmateName: string,
  looks: number
): ClassmateInteractionResult {
  const base = {
    play: { relationship: 12, social: 3, happiness: 3, log: `Played with ${classmateName} at school.` },
    shareToy: { relationship: 8, social: 2, happiness: 2, log: `Shared a toy with ${classmateName}.` },
    talk: { relationship: 5, social: 1, happiness: 1, log: `Talked with ${classmateName} at school.` },
  }[action];

  if (Math.random() < classmateInteractionFailChance(looks)) {
    return {
      relationshipDelta: CLASSMATE_CONFLICT_RELATIONSHIP_DELTA,
      socialDelta: 0,
      happinessDelta: -2,
      logText: `Had a falling-out with ${classmateName} at school.`,
      conflictReason: pick(CLASSMATE_CONFLICT_REASONS),
    };
  }

  return {
    relationshipDelta: base.relationship,
    socialDelta: base.social,
    happinessDelta: base.happiness,
    logText: base.log,
    conflictReason: null,
  };
}

// ===== Parent involvement =====

const PARENT_MEETING_CHANCE = 0.15;
const PARENT_MEETING_MISS_CHANCE = 0.15;
const PARENT_DRIFT_RATE = 0.25;

function schoolPerformanceScore(school: School): number {
  return Math.round(
    (school.behavior + school.socialProgress + school.attendance + school.teacherRelationship + overallLearningProgress(school)) / 5
  );
}

// Each month: parent help level drifts toward a baseline set by family
// relationships + parent jobs (with a little random jitter standing in for
// "random events"); parent satisfaction drifts toward how well the kid is
// actually doing in school; and there's a monthly chance of a
// parent-teacher meeting, which can swing both.
export function updateParentInvolvement(c: Character): Character {
  if (!c.school) return c;
  const school = c.school;

  const helpTarget = computeParentHelpBaseline(c.relatives);
  const helpJitter = Math.round(Math.random() * 10 - 5);
  let parentHelpLevel = clamp(
    school.parentHelpLevel + Math.round((helpTarget - school.parentHelpLevel) * PARENT_DRIFT_RATE) + helpJitter
  );

  const performance = schoolPerformanceScore(school);
  const satisfactionJitter = Math.round(Math.random() * 6 - 3);
  let parentSatisfaction = clamp(
    school.parentSatisfaction + Math.round((performance - school.parentSatisfaction) * PARENT_DRIFT_RATE) + satisfactionJitter
  );

  let parentTeacherMeetingStatus: ParentTeacherMeetingStatus = school.parentTeacherMeetingStatus;
  let log = c.log;

  if (Math.random() < PARENT_MEETING_CHANCE) {
    if (Math.random() < PARENT_MEETING_MISS_CHANCE) {
      parentTeacherMeetingStatus = 'Meeting Missed';
      parentSatisfaction = clamp(parentSatisfaction - 5);
      parentHelpLevel = clamp(parentHelpLevel - 5);
      log = [...log, { age: c.age, month: c.month, text: 'Your parents missed the parent-teacher meeting this month.', kind: 'major' }];
    } else if (performance >= 50) {
      parentTeacherMeetingStatus = 'Meeting Went Well';
      parentSatisfaction = clamp(parentSatisfaction + 12);
      parentHelpLevel = clamp(parentHelpLevel + 5);
      log = [...log, { age: c.age, month: c.month, text: `${school.teacher.name} told your parents you're doing great in class.`, kind: 'major' }];
    } else {
      parentTeacherMeetingStatus = 'Meeting Was Tense';
      parentSatisfaction = clamp(parentSatisfaction - 10);
      log = [...log, { age: c.age, month: c.month, text: `${school.teacher.name} had a tense talk with your parents about your progress.`, kind: 'major' }];
    }
  }

  return {
    ...c,
    log,
    school: { ...school, parentHelpLevel, parentSatisfaction, parentTeacherMeetingStatus },
  };
}
