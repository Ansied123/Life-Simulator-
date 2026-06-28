import type {
  Character,
  Classmate,
  ClassmateArchetype,
  ClassmateStatus,
  Effects,
  GameEvent,
  Item,
  ParentTeacherMeetingStatus,
  ProgressReportData,
  Relative,
  School,
  SchoolCulture,
  SchoolGoalId,
  SchoolSubject,
  SchoolType,
  Teacher,
  TeacherPersonality,
  Temperament,
} from './types';
import { SCHOOL_SUBJECTS } from './types';
import { randomGender, randomFirstName, randomLastName } from './names';
import { currentCalendarMonth } from './calendar';
import {
  randomTemperament,
  randomSchoolCulture,
  adjustSchoolDelta,
  adjustSubjectDelta,
  temperamentClassmateRelationshipBonus,
  temperamentClassmateSocialMultiplier,
  temperamentConflictChanceMultiplier,
  temperamentConflictHappinessDelta,
  cultureSatisfactionSwingMultiplier,
} from './schoolTraits';
import {
  randomArchetype,
  archetypeStartingRelationship,
  archetypeActionMultiplier,
  archetypeRelationshipMultiplier,
  archetypeHappinessMultiplier,
  archetypeConflictChanceMultiplier,
  archetypeConflictSocialPenaltyMultiplier,
  archetypeHighRelationshipSocialBonus,
} from './classmateArchetypes';
import { tagTeacherRelationshipBonus } from './reputationTags';
import { KINDERGARTEN_REPEAT_EVENT } from './events/kindergartenRepeat';
import {
  applyDiminishingReturns,
  lowHappinessConflictChanceMultiplier,
  LOW_HEALTH_THRESHOLD,
  LOW_HEALTH_ATTENDANCE_DIP_CHANCE,
  LOW_HEALTH_ATTENDANCE_DIP_AMOUNT,
} from './balance';

// A child must already be 5 by the September enrollment date; one born
// later in the year (e.g. October) waits for the following September.
export const SCHOOL_START_AGE = 5;
const KINDERGARTEN_START_MONTH = 9; // September
const KINDERGARTEN_END_MONTH = 5; // May

// Monthly "energy" budget for school-related actions; see School.focusPoints.
export const MAX_FOCUS_POINTS = 4;

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

// Two flavor lines per personality, revealed one at a time over the course
// of an enrollment so the player can slowly infer the (never-shown) number
// above purely from observation — see maybeRevealTeacherHint below.
const TEACHER_HINTS: Record<TeacherPersonality, [string, string]> = {
  Kind: [
    'seems to genuinely care how you are feeling, not just how you are behaving.',
    'always has an encouraging word, even after a rough day.',
  ],
  Strict: [
    'does not let much slide — every rule matters in that classroom.',
    'expects you to follow directions the first time, no exceptions.',
  ],
  Funny: [
    'cracks jokes mid-lesson and loves when the class laughs along.',
    'has a silly side, but expects real focus once the joke is over.',
  ],
  Patient: [
    'never seems to rush you, even when you are struggling.',
    'gives second chances when you make a mistake.',
  ],
  Serious: [
    'runs a no-nonsense classroom and expects everyone to stay on task.',
    'rarely smiles during lessons, but seems to respect real effort.',
  ],
  Energetic: [
    'has so much energy some days it is hard to keep up.',
    'turns even boring lessons into something high-energy.',
  ],
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
  const archetype = randomArchetype();
  const startingOverride = archetypeStartingRelationship(archetype);
  return {
    id: `classmate-${Math.floor(Math.random() * 1e9)}`,
    name: randomFirstName(gender),
    archetype,
    relationship: startingOverride ?? 25 + Math.round(Math.random() * 50),
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

function generateSchool(
  smarts: number,
  relatives: Relative[],
  enrolledAge: number,
  enrolledMonth: number,
  temperament: Temperament
): School {
  const classmateCount = 8 + Math.floor(Math.random() * 3); // 8-10
  const culture = randomSchoolCulture();
  return {
    level: 'Kindergarten',
    grade: 'K',
    name: randomSchoolName(),
    district: randomDistrict(),
    type: randomSchoolType(),
    culture,
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
    focusPoints: MAX_FOCUS_POINTS,
    teacherHintsRevealed: 0,
    goalIds: pickGoals(temperament, culture),
    withdrawalRiskStreak: 0,
    hadStageFright: false,
    bullyConflictCount: 0,
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
  const temperament = c.temperament ?? randomTemperament();
  const school = generateSchool(c.stats.smarts, c.relatives, c.age, c.month, temperament);
  return {
    ...c,
    school,
    temperament,
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
      focusPoints: MAX_FOCUS_POINTS,
    },
  };
}

const WITHDRAWAL_GRACE_MONTHS = 3;
const WITHDRAWAL_VERY_LOW = 10;
const WITHDRAWAL_RISK_CHANCE = 0.25;

// Permanently removes the character from school, whatever the reason.
// Kindergarten isn't offered again afterward, by dropout or otherwise.
export function dropOutOfSchool(c: Character, reason = 'Dropped out of kindergarten.'): Character {
  return applyMemoryCarryForwardBonus({
    ...c,
    school: null,
    completedKindergarten: true,
    log: [...c.log, { age: c.age, month: c.month, text: reason, kind: 'major' }],
  });
}

// Checked in order — the first matching crisis names the reason if things
// eventually do reach withdrawal.
const WITHDRAWAL_CRISIS_REASONS: { check: (c: Character) => boolean; reason: string }[] = [
  {
    check: (c) => c.school!.behavior <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten due to severe behavior issues.',
  },
  {
    check: (c) => c.school!.attendance <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten due to chronic absence.',
  },
  {
    check: (c) => c.school!.socialProgress <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten after struggling to fit in socially.',
  },
  {
    check: (c) => c.school!.teacherRelationship <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten after an ongoing conflict between the school and family.',
  },
  {
    check: (c) => overallLearningProgress(c.school!) <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten — the school felt the child was not ready yet.',
  },
  {
    check: (c) => c.school!.parentSatisfaction <= WITHDRAWAL_VERY_LOW || c.school!.parentHelpLevel <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten amid family instability at home.',
  },
  {
    check: (c) => c.stats.health <= WITHDRAWAL_VERY_LOW,
    reason: 'Withdrawn from kindergarten due to ongoing health concerns.',
  },
];

function matchedWithdrawalReason(c: Character): string | null {
  return WITHDRAWAL_CRISIS_REASONS.find((r) => r.check(c))?.reason ?? null;
}

// At least WITHDRAWAL_GRACE_MONTHS into kindergarten, a sustained crisis
// escalates over 3 consecutive months instead of risking withdrawal out of
// nowhere: a quiet warning, then an intervention that actually moves the
// numbers, and only then a real (25%/month) chance of withdrawal. Recovering
// at any point resets the streak.
export function maybeWithdrawFromKindergarten(c: Character): Character {
  if (!c.school || monthsSinceEnrollment(c) < WITHDRAWAL_GRACE_MONTHS) return c;
  const reason = matchedWithdrawalReason(c);

  if (!reason) {
    return c.school.withdrawalRiskStreak > 0 ? { ...c, school: { ...c.school, withdrawalRiskStreak: 0 } } : c;
  }

  const streak = c.school.withdrawalRiskStreak + 1;
  const school = { ...c.school, withdrawalRiskStreak: streak };

  if (streak === 1) {
    return {
      ...c,
      school,
      log: [...c.log, { age: c.age, month: c.month, text: 'The school is concerned about your progress.', kind: 'major' }],
    };
  }

  if (streak === 2) {
    const attendChance = { High: 0.8, Medium: 0.5, Low: 0.2 }[parentHelpLevelLabel(school.parentHelpLevel)];
    const attended = Math.random() < attendChance;
    return {
      ...c,
      school: {
        ...school,
        parentSatisfaction: clamp(school.parentSatisfaction + (attended ? -3 : -8)),
        parentHelpLevel: attended ? clamp(school.parentHelpLevel + 8) : school.parentHelpLevel,
        teacherRelationship: attended ? school.teacherRelationship : clamp(school.teacherRelationship - 5),
      },
      log: [
        ...c.log,
        {
          age: c.age,
          month: c.month,
          text: attended
            ? 'Your teacher requested a support meeting, and your parents attended.'
            : 'Your teacher requested a support meeting, but your parents missed it.',
          kind: 'major',
        },
      ],
    };
  }

  // streak >= 3: a real chance of withdrawal each month the crisis continues.
  if (Math.random() < WITHDRAWAL_RISK_CHANCE) {
    return dropOutOfSchool({ ...c, school }, reason);
  }
  return { ...c, school };
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

// Also the floor the "new best friend" event guarantees, and the point past
// which interaction fail chance is more forgiving.
export const BEST_FRIEND_THRESHOLD = 80;

export function classmateStatusLabel(score: number): ClassmateStatus {
  if (score >= BEST_FRIEND_THRESHOLD) return 'Best Friend';
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
        const adjusted = adjustSubjectDelta(subject, delta, c.temperament, school.culture, school.subjects[subject]);
        subjects[subject] = clamp(subjects[subject] + adjusted);
      }
    }
    const attendanceDelta = adjustSchoolDelta('attendance', se.attendance ?? 0, c.temperament, school.culture, school.attendance);
    const behaviorDelta = adjustSchoolDelta('behavior', se.behavior ?? 0, c.temperament, school.culture, school.behavior);
    let teacherRelDelta = adjustSchoolDelta(
      'teacherRelationship',
      se.teacherRelationship ?? 0,
      c.temperament,
      school.culture,
      school.teacherRelationship
    );
    if (teacherRelDelta > 0) teacherRelDelta += tagTeacherRelationshipBonus(school);
    const socialDelta = adjustSchoolDelta('socialProgress', se.socialProgress ?? 0, c.temperament, school.culture, school.socialProgress);
    school = {
      ...school,
      attendance: clamp(school.attendance + attendanceDelta),
      behavior: clamp(school.behavior + Math.round(behaviorDelta * mods.behavior)),
      socialProgress: clamp(school.socialProgress + socialDelta),
      teacherRelationship: clamp(school.teacherRelationship + Math.round(teacherRelDelta * mods.teacherRelationship)),
      subjects,
      parentSatisfaction: clamp(school.parentSatisfaction + (se.parentSatisfaction ?? 0)),
      parentHelpLevel: clamp(school.parentHelpLevel + (se.parentHelpLevel ?? 0)),
    };
  }

  if (effects.classmateEffects) {
    const ce = effects.classmateEffects;
    school = {
      ...school,
      classmates: school.classmates.map((cm) => {
        const match = ce.find((e) => e.classmateId === cm.id);
        if (!match) return cm;
        const bonus = match.relationship > 0 ? temperamentClassmateRelationshipBonus(c.temperament) : 0;
        let relationship = clamp(cm.relationship + match.relationship + bonus);
        if (match.minRelationship !== undefined) relationship = clamp(Math.max(relationship, match.minRelationship));
        return { ...cm, relationship };
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
  // A small "moment" sentence shown in the Life Record the instant it's
  // earned — distinct from the plain description used in the inventory.
  moment: string;
  // Months into the cycle before this award can first be earned (default 0).
  minMonth?: number;
  requirement: (school: School) => boolean;
}

// A few awards lean opposite directions on the same stat (e.g. Best Listener
// wants high behavior, Class Clown Ribbon wants disruptive-but-social), so a
// single run naturally can't sweep every award — different kids collect
// different ones.
export const SCHOOL_AWARDS: SchoolAward[] = [
  {
    id: 'perfect_attendance',
    name: 'Perfect Attendance',
    icon: '📅',
    description: 'Maintained perfect attendance at school.',
    moment: 'Your teacher announced you have perfect attendance, and the whole class clapped.',
    minMonth: 2,
    requirement: (s) => s.attendance >= 100,
  },
  {
    id: 'student_of_the_month',
    name: 'Student of the Month',
    icon: '🌟',
    description: 'Recognized for excellent behavior, learning, and teacher relationship.',
    moment: 'Your teacher named you Student of the Month in front of the whole class.',
    // Elite Reputation schools set the bar higher for the learning component.
    requirement: (s) =>
      s.behavior >= 80 && s.teacherRelationship >= 80 && overallLearningProgress(s) >= (s.culture === 'Elite Reputation' ? 70 : 60),
  },
  {
    id: 'best_helper',
    name: 'Best Helper',
    icon: '🧽',
    description: 'Always the first to lend the teacher a hand.',
    moment: 'Your teacher thanked you for always being the first to help out.',
    requirement: (s) => s.teacherRelationship >= 90,
  },
  {
    id: 'best_listener',
    name: 'Best Listener',
    icon: '👂',
    description: 'Always listens carefully and follows directions.',
    moment: 'Your teacher praised you for always listening so carefully.',
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
    moment: 'Your teacher hung your artwork up for the whole class to admire.',
    requirement: (s) => s.subjects['Art'] >= 75 || s.subjects['Music'] >= 75,
  },
  {
    id: 'kindness_award',
    name: 'Kindness Award',
    icon: '💛',
    description: 'Known across the classroom for kindness to every classmate.',
    moment: 'Your teacher gave you the Kindness Award for how you treat your classmates.',
    requirement: (s) => s.socialProgress >= 85,
  },
  {
    id: 'reading_star',
    name: 'Reading Star',
    icon: '📖',
    description: 'Mastered early reading skills ahead of the class.',
    moment: 'Your teacher gave you a Reading Star sticker for racing ahead in reading.',
    requirement: (s) => s.subjects['Reading Readiness'] >= (s.culture === 'Elite Reputation' ? 92 : 85),
  },
  {
    id: 'counting_star',
    name: 'Counting Star',
    icon: '🔢',
    description: 'Mastered early counting and number skills.',
    moment: 'Your teacher gave you a Counting Star sticker for racing ahead in numbers.',
    requirement: (s) => s.subjects['Counting & Numbers'] >= (s.culture === 'Elite Reputation' ? 92 : 85),
  },
  {
    id: 'great_friend_award',
    name: 'Great Friend Award',
    icon: '🤝',
    description: 'Formed an unbreakable bond with a classmate.',
    moment: 'Your teacher noticed your unbreakable bond with a classmate and celebrated it with the class.',
    requirement: (s) => s.classmates.some((cm) => cm.relationship >= 95),
  },
  {
    id: 'class_clown_ribbon',
    name: 'Class Clown Ribbon',
    icon: '🤡',
    description: 'Kept the whole room laughing — and a little out of line.',
    moment: 'Your teacher handed you a joking "Class Clown" ribbon for keeping the room laughing.',
    minMonth: 2,
    requirement: (s) => s.socialProgress >= 70 && s.behavior <= 50,
  },
  {
    id: 'quiet_achiever',
    name: 'Quiet Achiever',
    icon: '🤫',
    description: 'Made real academic progress without ever needing the spotlight.',
    moment: 'Your teacher quietly told you how impressed she was with your focus.',
    requirement: (s) => overallLearningProgress(s) >= 70 && s.socialProgress <= 40,
  },
];

// Checks every kindergarten award the character hasn't already earned, and
// grants any newly-qualifying ones as inventory items, plus a small boost —
// happiness, parent pride, and a nudge in the teacher's eyes.
const AWARD_HAPPINESS_BONUS = 4;
const AWARD_PARENT_SATISFACTION_BONUS = 5;
const AWARD_TEACHER_RELATIONSHIP_BONUS = 2;

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
    stats: { ...c.stats, happiness: clamp(c.stats.happiness + AWARD_HAPPINESS_BONUS * newlyEarned.length) },
    log: [...c.log, ...newlyEarned.map((a) => ({ age: c.age, month: c.month, text: a.moment, kind: 'major' as const }))],
    school: {
      ...school,
      awardsEarned: [...school.awardsEarned, ...newlyEarned.map((a) => a.id)],
      parentSatisfaction: clamp(school.parentSatisfaction + AWARD_PARENT_SATISFACTION_BONUS * newlyEarned.length),
      teacherRelationship: clamp(school.teacherRelationship + AWARD_TEACHER_RELATIONSHIP_BONUS * newlyEarned.length),
    },
  };
}

// ===== Yearly mini-goals =====

export interface SchoolGoal {
  id: SchoolGoalId;
  label: string;
  description: string;
  isComplete: (school: School) => boolean;
}

export const SCHOOL_GOALS: SchoolGoal[] = [
  {
    id: 'make_friend',
    label: 'Make a Friend',
    description: 'Reach Friend status with at least one classmate.',
    isComplete: (s) => s.classmates.some((cm) => cm.relationship >= 60),
  },
  {
    id: 'reading_target',
    label: 'Reading Readiness',
    description: 'Reach 50+ in Reading Readiness.',
    isComplete: (s) => s.subjects['Reading Readiness'] >= 50,
  },
  {
    id: 'behavior_target',
    label: 'Good Behavior',
    description: 'Keep Behavior above 70.',
    isComplete: (s) => s.behavior > 70,
  },
  {
    id: 'teacher_relationship_target',
    label: 'Teacher Bond',
    description: 'Raise your Teacher Relationship to 65.',
    isComplete: (s) => s.teacherRelationship >= 65,
  },
  {
    id: 'earn_award',
    label: 'Earn an Award',
    description: 'Earn any school award this year.',
    isComplete: (s) => s.awardsEarned.length > 0,
  },
  {
    id: 'social_target',
    label: 'Social Progress',
    description: 'Raise Social Progress to 60.',
    isComplete: (s) => s.socialProgress >= 60,
  },
  {
    id: 'attendance_target',
    label: 'Strong Attendance',
    description: 'Attend at least 90% of school days.',
    isComplete: (s) => s.attendance >= 90,
  },
];

// Goals lean toward whatever would actually stretch this particular kid — a
// Shy child is nudged toward "make a friend," an Academic-Focused school
// toward a learning target, and so on. (Parent attitude would belong here
// too, but that's its own not-yet-built system.)
function goalWeight(id: SchoolGoalId, temperament: Temperament, culture: SchoolCulture): number {
  let weight = 1;
  if (id === 'make_friend' && temperament === 'Shy') weight *= 1.6;
  if (id === 'social_target' && temperament === 'Bold') weight *= 1.4;
  if (id === 'reading_target' && culture === 'Academic-Focused') weight *= 1.5;
  if (id === 'attendance_target' && culture === 'Underfunded') weight *= 1.3;
  if (id === 'teacher_relationship_target' && culture === 'Strict Discipline') weight *= 1.4;
  return weight;
}

const GOALS_PER_YEAR = 3;

function pickGoals(temperament: Temperament, culture: SchoolCulture): SchoolGoalId[] {
  const pool = SCHOOL_GOALS.map((g) => ({ id: g.id, weight: goalWeight(g.id, temperament, culture) }));
  const chosen: SchoolGoalId[] = [];
  while (chosen.length < GOALS_PER_YEAR && pool.length > 0) {
    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      roll -= pool[idx].weight;
      if (roll <= 0) break;
    }
    chosen.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return chosen;
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

const GOAL_COMPLETION_HAPPINESS_BONUS = 3;
const GOAL_COMPLETION_PARENT_SATISFACTION_BONUS = 5;

// Every May, the kindergarten cycle ends regardless of the child's exact
// age at that point: they receive a progress report summarizing the year. A
// promoted child leaves school automatically; one who isn't gets handed an
// interactive decision instead (see KINDERGARTEN_REPEAT_EVENT) — the actual
// school-state change happens in moveOnDespiteRecommendation /
// repeatKindergartenYear / switchSchoolAndRepeat once that's resolved.
export function maybeEndKindergarten(c: Character): { character: Character; pendingEvent: GameEvent | null } {
  if (!c.school || currentCalendarMonth(c.birthMonth, c.month) !== KINDERGARTEN_END_MONTH) {
    return { character: c, pendingEvent: null };
  }
  const school = c.school;
  const learning = overallLearningProgress(school);
  const promoted = learning >= PROMOTION_LEARNING_THRESHOLD;

  const completedGoals = school.goalIds
    .map((id) => SCHOOL_GOALS.find((g) => g.id === id))
    .filter((g): g is SchoolGoal => !!g && g.isComplete(school));
  const metAnyGoal = completedGoals.length > 0;

  const report: ProgressReportData = {
    schoolName: school.name,
    teacherName: school.teacher.name,
    overallLearning: learning,
    behavior: school.behavior,
    socialProgress: school.socialProgress,
    attendance: school.attendance,
    teacherComment: teacherComment(school, promoted),
    awards: school.awardsEarned.map((id) => SCHOOL_AWARDS.find((a) => a.id === id)?.name ?? id),
    goalsCompleted: completedGoals.map((g) => g.label),
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

  const withReport: Character = {
    ...c,
    inventory: [...c.inventory, reportItem],
    stats: { ...c.stats, happiness: clamp(c.stats.happiness + (metAnyGoal ? GOAL_COMPLETION_HAPPINESS_BONUS : 0)) },
    school: {
      ...school,
      parentSatisfaction: clamp(school.parentSatisfaction + (metAnyGoal ? GOAL_COMPLETION_PARENT_SATISFACTION_BONUS : 0)),
    },
    log: metAnyGoal
      ? [
          ...c.log,
          {
            age: c.age,
            month: c.month,
            text: `Met this year's goal${completedGoals.length > 1 ? 's' : ''}: ${completedGoals.map((g) => g.label).join(', ')}.`,
            kind: 'major',
          },
        ]
      : c.log,
  };

  if (!promoted) {
    return { character: withReport, pendingEvent: KINDERGARTEN_REPEAT_EVENT };
  }

  return {
    character: applyMemoryCarryForwardBonus({
      ...withReport,
      school: null,
      completedKindergarten: true,
      log: [...withReport.log, { age: c.age, month: c.month, text: 'Finished kindergarten and was promoted to Grade 1!', kind: 'major' }],
    }),
    pendingEvent: null,
  };
}

const MOVE_ON_PENALTY_SMARTS = 2;
const MOVE_ON_PENALTY_HAPPINESS = 2;
const REPEAT_PENALTY_HAPPINESS = 5;
const REPEAT_PENALTY_PARENT_SATISFACTION = 5;
const SWITCH_SCHOOL_PENALTY_HAPPINESS = 5;
const SWITCH_SCHOOL_PENALTY_PARENT_SATISFACTION = 10;

// "Move on anyway" despite the recommendation to repeat: the child heads to
// Grade 1 underprepared, at a small lasting cost.
export function moveOnDespiteRecommendation(c: Character): Character {
  return applyMemoryCarryForwardBonus({
    ...c,
    school: null,
    completedKindergarten: true,
    stats: {
      ...c.stats,
      smarts: clamp(c.stats.smarts - MOVE_ON_PENALTY_SMARTS),
      happiness: clamp(c.stats.happiness - MOVE_ON_PENALTY_HAPPINESS),
    },
    log: [
      ...c.log,
      { age: c.age, month: c.month, text: 'Moved on to Grade 1 despite the recommendation to repeat kindergarten.', kind: 'major' },
    ],
  });
}

// "Repeat kindergarten": same school, but a fresh year — new teacher, new
// classmates, school-record stats reset, new goals. Subject progress is
// kept; the child did genuinely learn that much already.
export function repeatKindergartenYear(c: Character): Character {
  if (!c.school) return c;
  const school = c.school;
  const classmateCount = 8 + Math.floor(Math.random() * 3);
  const temperament = c.temperament ?? randomTemperament();
  const refreshed: School = {
    ...school,
    teacher: randomTeacher(),
    classmates: Array.from({ length: classmateCount }, makeClassmate),
    enrolledAge: c.age,
    enrolledMonth: c.month,
    attendance: 100,
    behavior: 100,
    socialProgress: 50,
    teacherRelationship: 50,
    subjectsStudiedThisMonth: freshStudyFlags(),
    actionsUsedThisMonth: [],
    awardsEarned: [],
    parentSatisfaction: clamp(school.parentSatisfaction - REPEAT_PENALTY_PARENT_SATISFACTION),
    parentTeacherMeetingStatus: 'Not Yet Scheduled',
    focusPoints: MAX_FOCUS_POINTS,
    teacherHintsRevealed: 0,
    goalIds: pickGoals(temperament, school.culture),
    withdrawalRiskStreak: 0,
    hadStageFright: false,
    bullyConflictCount: 0,
  };
  return {
    ...c,
    school: refreshed,
    temperament,
    stats: { ...c.stats, happiness: clamp(c.stats.happiness - REPEAT_PENALTY_HAPPINESS) },
    log: [...c.log, { age: c.age, month: c.month, text: 'Stayed back to repeat kindergarten with a new teacher and class.', kind: 'major' }],
  };
}

// "Switch school and repeat": an entirely new school — new culture, type,
// teacher, classmates, and subjects reset to a fresh baseline. The bigger
// parent-satisfaction penalty reflects the disruption; the reset school
// record also naturally clears out any bad reputation tags (Trouble Magnet,
// etc.), since those are derived live from current stats rather than stored.
export function switchSchoolAndRepeat(c: Character): Character {
  const temperament = c.temperament ?? randomTemperament();
  const freshSchool = generateSchool(c.stats.smarts, c.relatives, c.age, c.month, temperament);
  return {
    ...c,
    school: { ...freshSchool, parentSatisfaction: clamp(freshSchool.parentSatisfaction - SWITCH_SCHOOL_PENALTY_PARENT_SATISFACTION) },
    temperament,
    stats: { ...c.stats, happiness: clamp(c.stats.happiness - SWITCH_SCHOOL_PENALTY_HAPPINESS) },
    log: [
      ...c.log,
      { age: c.age, month: c.month, text: `Switched schools and will repeat kindergarten at ${freshSchool.name}.`, kind: 'major' },
    ],
  };
}

// ===== Milestone memories =====
// Small narrative artifacts kept in the inventory forever, plus — for a
// couple of them — a tiny one-time stat nudge applied the moment kindergarten
// ends for good (see applyMemoryCarryForwardBonus). There's no elementary
// school system yet for these to feed into directly, so the payoff lands as
// a flat "starting advantage" right at the transition out of kindergarten
// rather than as an ongoing modifier into a system that doesn't exist —
// "even +2 starting advantage later is enough."

export interface KindergartenMemory {
  id: string;
  name: string;
  icon: string;
  description: string;
  moment: string;
  requirement: (c: Character) => boolean;
}

const BULLY_CONFLICT_MEMORY_THRESHOLD = 3;

export const KINDERGARTEN_MEMORIES: KindergartenMemory[] = [
  {
    id: 'memory_first_best_friend',
    name: 'First Best Friend',
    icon: '🧑‍🤝‍🧑',
    description: 'Made a best friend in kindergarten.',
    moment: 'You made your first real best friend — a memory you will carry with you.',
    requirement: (c) => !!c.school && c.school.classmates.some((cm) => cm.relationship >= BEST_FRIEND_THRESHOLD),
  },
  {
    id: 'memory_loved_reading',
    name: 'Loved Reading Early',
    icon: '📚',
    description: 'Fell in love with reading in kindergarten.',
    moment: 'You fell in love with reading this year.',
    requirement: (c) => !!c.school && c.school.subjects['Reading Readiness'] >= 80,
  },
  {
    id: 'memory_stage_fright',
    name: 'Kindergarten Stage Fright',
    icon: '😳',
    description: 'Froze up on stage at the kindergarten talent show.',
    moment: 'Freezing up at the talent show is a memory that still makes you a little nervous.',
    requirement: (c) => !!c.school && c.school.hadStageFright,
  },
  {
    id: 'memory_playground_bully',
    name: 'Playground Bully Memory',
    icon: '😟',
    description: 'Dealt with a bully repeatedly in kindergarten.',
    moment: 'A tough run-in with a bully at school is something you will carry with you — but it also taught you to bounce back.',
    requirement: (c) => !!c.school && c.school.bullyConflictCount >= BULLY_CONFLICT_MEMORY_THRESHOLD,
  },
];

// Checked monthly: grants any newly-qualifying memory as a permanent
// inventory keepsake (never removed, never re-triggered).
export function checkKindergartenMemories(c: Character): Character {
  if (!c.school) return c;
  const newlyTriggered = KINDERGARTEN_MEMORIES.filter((m) => !c.inventory.some((i) => i.id === m.id) && m.requirement(c));
  if (newlyTriggered.length === 0) return c;

  const items: Item[] = newlyTriggered.map((m) => ({ id: m.id, name: m.name, icon: m.icon, description: m.description, acquiredAge: c.age }));
  return {
    ...c,
    inventory: [...c.inventory, ...items],
    log: [...c.log, ...newlyTriggered.map((m) => ({ age: c.age, month: c.month, text: m.moment, kind: 'major' as const }))],
  };
}

const MEMORY_CARRY_FORWARD_HAPPINESS_BONUS = 2;
const MEMORY_CARRY_FORWARD_SMARTS_BONUS = 2;

// Applied once, at the moment kindergarten ends for good — whether promoted,
// moved on anyway, or withdrawn. Idempotent against being called more than
// once per character only in the sense that it's only ever called from the
// 3 true exit points, each of which fires exactly once per kindergarten run.
function applyMemoryCarryForwardBonus(c: Character): Character {
  const hasBestFriendMemory = c.inventory.some((i) => i.id === 'memory_first_best_friend');
  const hasReadingMemory = c.inventory.some((i) => i.id === 'memory_loved_reading');
  if (!hasBestFriendMemory && !hasReadingMemory) return c;
  return {
    ...c,
    stats: {
      ...c.stats,
      happiness: clamp(c.stats.happiness + (hasBestFriendMemory ? MEMORY_CARRY_FORWARD_HAPPINESS_BONUS : 0)),
      smarts: clamp(c.stats.smarts + (hasReadingMemory ? MEMORY_CARRY_FORWARD_SMARTS_BONUS : 0)),
    },
  };
}

// ===== Classmate interactions =====

const CLASSMATE_CONFLICT_RELATIONSHIP_DELTA = -10;
// A public falling-out costs more than just the one relationship.
const CLASSMATE_CONFLICT_SOCIAL_DELTA = -4;

// Better-looking kids have an easier time socially: the usual 20% conflict
// chance only applies in the 60-79 range, dropping to 10% above 80 and
// climbing 5% for every 10 points below 60. Once a classmate is a Best
// Friend, the bond itself cushions the odds — halved, regardless of looks.
export function classmateInteractionFailChance(
  looks: number,
  relationship: number,
  temperament: Temperament | null = null,
  happiness = 100
): number {
  const base = (() => {
    if (looks >= 80) return 0.1;
    if (looks >= 60) return 0.2;
    if (looks >= 50) return 0.25;
    if (looks >= 40) return 0.3;
    if (looks >= 30) return 0.35;
    if (looks >= 20) return 0.4;
    if (looks >= 10) return 0.45;
    return 0.5;
  })();
  const friendAdjusted = relationship >= BEST_FRIEND_THRESHOLD ? base / 2 : base;
  return Math.min(
    1,
    friendAdjusted * temperamentConflictChanceMultiplier(temperament) * lowHappinessConflictChanceMultiplier(happiness)
  );
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
  looks: number,
  relationship: number,
  temperament: Temperament | null = null,
  archetype: ClassmateArchetype | undefined = undefined,
  happiness = 100
): ClassmateInteractionResult {
  const base = {
    play: { relationship: 12, social: 3, happiness: 3, log: `Played with ${classmateName} at school.` },
    shareToy: { relationship: 8, social: 2, happiness: 2, log: `Shared a toy with ${classmateName}.` },
    talk: { relationship: 5, social: 1, happiness: 1, log: `Talked with ${classmateName} at school.` },
  }[action];

  const failChance = Math.min(
    1,
    classmateInteractionFailChance(looks, relationship, temperament, happiness) * archetypeConflictChanceMultiplier(archetype)
  );
  if (Math.random() < failChance) {
    return {
      relationshipDelta: CLASSMATE_CONFLICT_RELATIONSHIP_DELTA,
      socialDelta: Math.round(CLASSMATE_CONFLICT_SOCIAL_DELTA * archetypeConflictSocialPenaltyMultiplier(archetype)),
      happinessDelta: temperamentConflictHappinessDelta(temperament),
      logText: `Had a falling-out with ${classmateName} at school.`,
      conflictReason: pick(CLASSMATE_CONFLICT_REASONS),
    };
  }

  const socialMult = temperamentClassmateSocialMultiplier(temperament);
  const actionMult = archetypeActionMultiplier(archetype, action);
  const relMult = archetypeRelationshipMultiplier(archetype);
  const highRelBonus = archetypeHighRelationshipSocialBonus(archetype, relationship);
  const rawRelationshipGain =
    Math.round(base.relationship * actionMult * relMult) + temperamentClassmateRelationshipBonus(temperament);
  return {
    relationshipDelta: Math.round(applyDiminishingReturns(relationship, rawRelationshipGain)),
    socialDelta: Math.round(base.social * socialMult * actionMult) + highRelBonus,
    happinessDelta: Math.round(base.happiness * archetypeHappinessMultiplier(archetype, action)),
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
  const swing = cultureSatisfactionSwingMultiplier(school.culture);

  const helpTarget = computeParentHelpBaseline(c.relatives);
  const helpJitter = Math.round(Math.random() * 10 - 5);
  let parentHelpLevel = clamp(
    school.parentHelpLevel + Math.round((helpTarget - school.parentHelpLevel) * PARENT_DRIFT_RATE) + helpJitter
  );

  const performance = schoolPerformanceScore(school);
  const satisfactionJitter = Math.round(Math.random() * 6 - 3);
  let parentSatisfaction = clamp(
    school.parentSatisfaction + Math.round((performance - school.parentSatisfaction) * PARENT_DRIFT_RATE * swing) + satisfactionJitter
  );

  // Academic-Focused parents are unforgiving of sustained low learning progress.
  if (school.culture === 'Academic-Focused' && overallLearningProgress(school) < 40) {
    parentSatisfaction = clamp(parentSatisfaction - 3);
  }

  let parentTeacherMeetingStatus: ParentTeacherMeetingStatus = school.parentTeacherMeetingStatus;
  let log = c.log;

  if (Math.random() < PARENT_MEETING_CHANCE) {
    if (Math.random() < PARENT_MEETING_MISS_CHANCE) {
      parentTeacherMeetingStatus = 'Meeting Missed';
      parentSatisfaction = clamp(parentSatisfaction - Math.round(5 * swing));
      parentHelpLevel = clamp(parentHelpLevel - 5);
      log = [...log, { age: c.age, month: c.month, text: 'Your parents missed the parent-teacher meeting this month.', kind: 'major' }];
    } else if (performance >= 50) {
      parentTeacherMeetingStatus = 'Meeting Went Well';
      parentSatisfaction = clamp(parentSatisfaction + Math.round(12 * swing));
      parentHelpLevel = clamp(parentHelpLevel + 5);
      log = [...log, { age: c.age, month: c.month, text: `${school.teacher.name} told your parents you're doing great in class.`, kind: 'major' }];
    } else {
      parentTeacherMeetingStatus = 'Meeting Was Tense';
      parentSatisfaction = clamp(parentSatisfaction - Math.round(10 * swing));
      log = [...log, { age: c.age, month: c.month, text: `${school.teacher.name} had a tense talk with your parents about your progress.`, kind: 'major' }];
    }
  }

  return {
    ...c,
    log,
    school: { ...school, parentHelpLevel, parentSatisfaction, parentTeacherMeetingStatus },
  };
}

const ACADEMIC_PRESSURE_CHANCE = 0.15;

// Academic-Focused schools occasionally pile on the pressure, denting
// happiness a little even when nothing else has gone wrong that month.
export function applyCulturePressure(c: Character): Character {
  if (!c.school || c.school.culture !== 'Academic-Focused') return c;
  if (Math.random() >= ACADEMIC_PRESSURE_CHANCE) return c;
  return {
    ...c,
    stats: { ...c.stats, happiness: clamp(c.stats.happiness - 1) },
    log: [...c.log, { age: c.age, month: c.month, text: 'Felt the pressure to keep up academically.', kind: 'self' }],
  };
}

// "Low health matters": a sickly kid misses more school, independent of any
// specific event firing that month.
export function applyLowHealthAttendanceDip(c: Character): Character {
  if (!c.school || c.stats.health > LOW_HEALTH_THRESHOLD) return c;
  if (Math.random() >= LOW_HEALTH_ATTENDANCE_DIP_CHANCE) return c;
  return {
    ...c,
    school: { ...c.school, attendance: clamp(c.school.attendance - LOW_HEALTH_ATTENDANCE_DIP_AMOUNT) },
    log: [...c.log, { age: c.age, month: c.month, text: 'Missed more school while feeling under the weather.', kind: 'self' }],
  };
}

const TEACHER_HINT_MIN_MONTHS = 2;
const TEACHER_HINT_CHANCE = 0.18;

// Slowly surfaces the teacher's hidden personality as plain observation, one
// of 2 lines at a time, never the exact number behind it.
export function maybeRevealTeacherHint(c: Character): Character {
  if (!c.school || c.school.teacherHintsRevealed >= 2) return c;
  if (monthsSinceEnrollment(c) < TEACHER_HINT_MIN_MONTHS) return c;
  if (Math.random() >= TEACHER_HINT_CHANCE) return c;

  const school = c.school;
  const hint = TEACHER_HINTS[school.teacher.personality][school.teacherHintsRevealed];
  return {
    ...c,
    school: { ...school, teacherHintsRevealed: school.teacherHintsRevealed + 1 },
    log: [...c.log, { age: c.age, month: c.month, text: `${school.teacher.name} ${hint}` }],
  };
}
