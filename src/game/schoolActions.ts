import type { Character, Effects, SchoolSubject } from './types';
import { SCHOOL_SUBJECTS } from './types';
import { overallLearningProgress } from './school';
import { temperamentRiskChanceMultiplier } from './schoolTraits';
import { lowHappinessRiskChanceMultiplier } from './balance';

// Which current stat to check when deciding if an action is at risk of going wrong.
export type SchoolActionRiskStat =
  | 'teacherRelationship'
  | 'behavior'
  | 'socialProgress'
  | 'attendance'
  | 'learning'
  | 'happiness'
  | 'smarts'
  | 'looks';

export interface SchoolActionRisk {
  stat: SchoolActionRiskStat;
  // The risk is only possible once the stat is at or below this.
  threshold: number;
  // Chance the risk actually triggers, once eligible (0-1).
  chance: number;
  // 'fizzle' = nothing happens at all (still uses up the month's action).
  // 'backfire' = the deltas below apply instead of the usual success effect.
  outcome: 'fizzle' | 'backfire';
  backfire?: {
    happiness?: number;
    smarts?: number;
    attendance?: number;
    behavior?: number;
    socialProgress?: number;
    teacherRelationship?: number;
    learning?: number; // applied uniformly across all 9 subjects
  };
  log: string; // past-tense life-log line shown instead of the success line
}

export interface SchoolAction {
  id: string;
  name: string; // button label
  log: string; // past-tense life-log line on success
  happiness?: number;
  smarts?: number;
  attendance?: number;
  behavior?: number;
  socialProgress?: number;
  teacherRelationship?: number;
  learning?: number; // applied uniformly across all 9 subjects
  // Checked in order; the first risk whose stat is low enough and whose
  // chance hits replaces the success effect entirely.
  risks?: SchoolActionRisk[];
}

export const SCHOOL_ACTIONS: SchoolAction[] = [
  {
    id: 'raise_hand',
    name: 'Raise Your Hand',
    log: 'Raised your hand and got the answer right!',
    teacherRelationship: 6,
    behavior: 3,
    risks: [
      {
        stat: 'teacherRelationship',
        threshold: 20,
        chance: 0.5,
        outcome: 'fizzle',
        log: 'Raised your hand, but the teacher called on someone else.',
      },
      {
        stat: 'learning',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { socialProgress: -6, happiness: -2 },
        log: 'Raised your hand but got the answer wrong, and the class snickered.',
      },
    ],
  },
  {
    id: 'clean_classroom',
    name: 'Help Clean the Classroom',
    log: 'Helped clean up the classroom.',
    teacherRelationship: 8,
    behavior: 4,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Offered to help clean up, but the teacher said you would just make a bigger mess.',
      },
    ],
  },
  {
    id: 'share_crayons',
    name: 'Share Your Crayons',
    log: 'Shared your crayons with a classmate.',
    socialProgress: 5,
    happiness: 2,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { socialProgress: -4 },
        log: 'Tried to share your crayons, but nobody wanted to play along.',
      },
    ],
  },
  {
    id: 'sit_quietly',
    name: 'Sit Quietly During the Lesson',
    log: 'Sat quietly during the lesson.',
    behavior: 6,
    teacherRelationship: 2,
    risks: [
      {
        stat: 'happiness',
        threshold: 15,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Tried to sit quietly, but could not stop fidgeting and gave up.',
      },
    ],
  },
  {
    id: 'ask_question',
    name: 'Ask the Teacher a Question',
    log: 'Asked your teacher a thoughtful question.',
    teacherRelationship: 5,
    smarts: 1,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Started to ask a question, but felt too embarrassed in front of the class and stayed quiet.',
      },
    ],
  },
  {
    id: 'line_leader',
    name: 'Volunteer to Be Line Leader',
    log: 'Volunteered to be line leader.',
    behavior: 5,
    teacherRelationship: 4,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 20,
        chance: 0.35,
        outcome: 'backfire',
        backfire: { socialProgress: -5 },
        log: 'Volunteered to be line leader, but the other kids complained and you got swapped out.',
      },
    ],
  },
  {
    id: 'daydream',
    name: 'Daydream During Class',
    log: 'Daydreamed through most of class.',
    learning: -4,
    happiness: 2,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { behavior: -6, teacherRelationship: -4 },
        log: 'Daydreamed through class and got caught — the teacher called you out in front of everyone.',
      },
    ],
  },
  {
    id: 'skip_class',
    name: 'Skip Class to Play Outside',
    log: 'Skipped class to play outside instead.',
    happiness: 12,
    socialProgress: 10,
    attendance: -15,
    behavior: -12,
    learning: -10,
    teacherRelationship: -10,
    risks: [
      {
        stat: 'attendance',
        threshold: 20,
        chance: 0.45,
        outcome: 'backfire',
        backfire: { attendance: -10, teacherRelationship: -8 },
        log: 'Skipped class again — this time the principal caught you and called home.',
      },
    ],
  },
  {
    id: 'tattle',
    name: 'Tattle on a Classmate',
    log: 'Tattled on a classmate.',
    teacherRelationship: 3,
    socialProgress: -8,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { socialProgress: -10 },
        log: 'Tattled on a classmate, and the whole class turned on you for snitching.',
      },
    ],
  },
  {
    id: 'make_class_laugh',
    name: 'Make the Whole Class Laugh',
    log: 'Made the whole class laugh.',
    happiness: 8,
    socialProgress: 8,
    behavior: -5,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { behavior: -10, teacherRelationship: -6 },
        log: 'Made the class laugh one too many times — the teacher sent you to the principal.',
      },
    ],
  },
  {
    id: 'color_outside_lines',
    name: 'Color Outside the Lines on Purpose',
    log: 'Colored outside the lines on purpose.',
    happiness: 3,
    behavior: -3,
    risks: [
      {
        stat: 'teacherRelationship',
        threshold: 20,
        chance: 0.35,
        outcome: 'backfire',
        backfire: { teacherRelationship: -5 },
        log: 'Colored outside the lines on purpose, and the teacher used it as an example of not following instructions.',
      },
    ],
  },
  {
    id: 'practice_handwriting',
    name: 'Practice Your Handwriting',
    log: 'Practiced your handwriting extra carefully.',
    learning: 6,
    risks: [
      {
        stat: 'smarts',
        threshold: 20,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Tried to practice handwriting, but got frustrated and gave up halfway through.',
      },
    ],
  },
  {
    id: 'read_quietly',
    name: 'Read a Book Quietly',
    log: 'Read a book quietly in the corner.',
    learning: 6,
    behavior: 2,
    risks: [
      {
        stat: 'attendance',
        threshold: 20,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Tried to read quietly, but could not follow the story after missing so many days.',
      },
    ],
  },
  {
    id: 'tantrum',
    name: 'Throw a Tantrum',
    log: 'Threw a tantrum in the middle of class.',
    happiness: -5,
    behavior: -15,
    teacherRelationship: -8,
    socialProgress: -5,
    risks: [
      {
        stat: 'happiness',
        threshold: 15,
        chance: 0.45,
        outcome: 'backfire',
        backfire: { happiness: -8, socialProgress: -8 },
        log: 'Threw a tantrum and could not calm down for the rest of the day.',
      },
    ],
  },
  {
    id: 'give_teacher_apple',
    name: 'Give Your Teacher an Apple',
    log: 'Gave your teacher an apple.',
    teacherRelationship: 10,
    happiness: 1,
    risks: [
      {
        stat: 'teacherRelationship',
        threshold: 15,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Brought your teacher an apple, but they seemed suspicious of the gesture.',
      },
    ],
  },
  {
    id: 'nap_through_storytime',
    name: 'Nap Through Storytime',
    log: 'Napped through storytime.',
    behavior: -4,
    happiness: 2,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { behavior: -8 },
        log: 'Napped through storytime and started snoring loud enough to disrupt the whole class.',
      },
    ],
  },
  {
    id: 'organize_toys',
    name: 'Organize the Toy Bin',
    log: 'Organized the toy bin without being asked.',
    behavior: 5,
    teacherRelationship: 3,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.35,
        outcome: 'backfire',
        backfire: { socialProgress: -4 },
        log: 'Organized the toy bin, but a classmate accused you of just trying to look busy.',
      },
    ],
  },
  {
    id: 'cut_in_line',
    name: 'Cut in Line',
    log: 'Cut in line at recess.',
    socialProgress: -6,
    behavior: -4,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 20,
        chance: 0.45,
        outcome: 'backfire',
        backfire: { socialProgress: -10 },
        log: 'Cut in line again, and the whole line turned on you.',
      },
    ],
  },
  {
    id: 'compliment_classmate',
    name: 'Compliment a Classmate',
    log: 'Complimented a classmate.',
    socialProgress: 6,
    happiness: 2,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.35,
        outcome: 'fizzle',
        log: 'Tried to compliment a classmate, but it came out awkward and nobody really noticed.',
      },
    ],
  },
  {
    id: 'refuse_to_share',
    name: 'Refuse to Share',
    log: 'Refused to share with the other kids.',
    socialProgress: -8,
    behavior: -3,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { behavior: -6, teacherRelationship: -5 },
        log: 'Refused to share, and the teacher stepped in to scold you in front of everyone.',
      },
    ],
  },
  {
    id: 'lead_group_activity',
    name: 'Lead a Group Activity',
    log: 'Led a group activity in class.',
    socialProgress: 10,
    teacherRelationship: 5,
    behavior: 3,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Volunteered to lead the group activity, but the teacher said your behavior needed to improve first.',
      },
    ],
  },
  {
    id: 'fake_sick',
    name: 'Pretend to Be Sick to Stay Home',
    log: 'Pretended to be sick to stay home.',
    attendance: -10,
    happiness: 5,
    risks: [
      {
        stat: 'teacherRelationship',
        threshold: 15,
        chance: 0.35,
        outcome: 'backfire',
        backfire: { teacherRelationship: -6, behavior: -4 },
        log: 'Pretended to be sick again, and your parents got a call questioning the absence.',
      },
    ],
  },
  {
    id: 'stay_focused',
    name: 'Stay Extra Focused on Lessons',
    log: 'Stayed extra focused on every lesson.',
    learning: 8,
    smarts: 1,
    risks: [
      {
        stat: 'happiness',
        threshold: 15,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Tried to stay focused, but could not concentrate no matter how hard you tried.',
      },
    ],
  },
  {
    id: 'doodle_instead',
    name: 'Doodle Instead of Working',
    log: 'Doodled instead of doing your work.',
    learning: -3,
    happiness: 2,
    risks: [
      {
        stat: 'smarts',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { learning: -5 },
        log: 'Doodled instead of working, and fell even further behind in class.',
      },
    ],
  },
  {
    id: 'apologize',
    name: 'Apologize After a Mistake',
    log: 'Apologized after making a mistake.',
    teacherRelationship: 5,
    behavior: 3,
    risks: [
      {
        stat: 'teacherRelationship',
        threshold: 15,
        chance: 0.4,
        outcome: 'fizzle',
        log: 'Tried to apologize, but it did not really land.',
      },
    ],
  },
  {
    id: 'show_off_recess',
    name: 'Show Off at Recess',
    log: 'Showed off at recess.',
    socialProgress: 5,
    happiness: 3,
    behavior: -2,
    risks: [
      {
        stat: 'looks',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { socialProgress: -6 },
        log: 'Showed off at recess, but it came across as try-hard and the other kids laughed at you, not with you.',
      },
    ],
  },
  {
    id: 'hide_during_group',
    name: 'Hide During Group Activities',
    log: 'Hid during a group activity.',
    socialProgress: -10,
    happiness: -2,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { socialProgress: -8 },
        log: 'Hid during group time again, and the teacher specifically called you out for not participating at all.',
      },
    ],
  },
  {
    id: 'bring_treats',
    name: 'Bring Treats to Share',
    log: 'Brought treats to share with the class.',
    socialProgress: 10,
    happiness: 4,
    risks: [
      {
        stat: 'socialProgress',
        threshold: 15,
        chance: 0.35,
        outcome: 'backfire',
        backfire: { socialProgress: -4 },
        log: 'Brought treats to share, but a classmate said you were just trying to buy friends, and it fell flat.',
      },
    ],
  },
  {
    id: 'stand_up_for_classmate',
    name: 'Stand Up for a Classmate',
    log: 'Stood up for a classmate who needed help.',
    socialProgress: 8,
    behavior: 2,
    teacherRelationship: 3,
    risks: [
      {
        stat: 'behavior',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { behavior: -8, teacherRelationship: -5 },
        log: 'Stood up for a classmate, but it turned into a shouting match and the teacher had to step in.',
      },
    ],
  },
  {
    id: 'throw_food',
    name: 'Throw Food in the Cafeteria',
    log: 'Threw food in the cafeteria.',
    behavior: -12,
    teacherRelationship: -6,
    happiness: 4,
    socialProgress: 3,
    risks: [
      {
        stat: 'attendance',
        threshold: 20,
        chance: 0.4,
        outcome: 'backfire',
        backfire: { attendance: -10, teacherRelationship: -10 },
        log: "Threw food again — this time you were sent to the principal's office, with a note sent home.",
      },
    ],
  },
];

function readRiskStat(stat: SchoolActionRiskStat, c: Character): number {
  const school = c.school!;
  switch (stat) {
    case 'teacherRelationship':
      return school.teacherRelationship;
    case 'behavior':
      return school.behavior;
    case 'socialProgress':
      return school.socialProgress;
    case 'attendance':
      return school.attendance;
    case 'learning':
      return overallLearningProgress(school);
    case 'happiness':
      return c.stats.happiness;
    case 'smarts':
      return c.stats.smarts;
    case 'looks':
      return c.stats.looks;
  }
}

function subjectsDelta(learning: number | undefined): Partial<Record<SchoolSubject, number>> | undefined {
  return learning ? (Object.fromEntries(SCHOOL_SUBJECTS.map((s) => [s, learning])) as Partial<Record<SchoolSubject, number>>) : undefined;
}

export function schoolActionToEffects(action: SchoolAction): Effects {
  return {
    happiness: action.happiness,
    smarts: action.smarts,
    log: action.log,
    logKind: 'self',
    schoolEffects: {
      attendance: action.attendance,
      behavior: action.behavior,
      socialProgress: action.socialProgress,
      teacherRelationship: action.teacherRelationship,
      subjects: subjectsDelta(action.learning),
    },
  };
}

// Rolls an action's real outcome against the character's current stats: each
// risk is checked in order, and the first one whose triggering stat is low
// enough (and whose chance hits) replaces the usual success effect with
// either nothing at all ('fizzle') or extra penalties on top ('backfire').
// The player never sees the odds in advance — only the outcome, after the fact.
export function resolveSchoolAction(action: SchoolAction, c: Character): Effects {
  for (const risk of action.risks ?? []) {
    const chance = Math.min(
      1,
      risk.chance * temperamentRiskChanceMultiplier(action.id, c.temperament) * lowHappinessRiskChanceMultiplier(c.stats.happiness)
    );
    if (readRiskStat(risk.stat, c) <= risk.threshold && Math.random() < chance) {
      if (risk.outcome === 'fizzle') {
        return { log: risk.log, logKind: 'self' };
      }
      const b = risk.backfire ?? {};
      return {
        happiness: b.happiness,
        smarts: b.smarts,
        log: risk.log,
        logKind: 'self',
        schoolEffects: {
          attendance: b.attendance,
          behavior: b.behavior,
          socialProgress: b.socialProgress,
          teacherRelationship: b.teacherRelationship,
          subjects: subjectsDelta(b.learning),
        },
      };
    }
  }

  return schoolActionToEffects(action);
}
