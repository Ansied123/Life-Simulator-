import type { Effects, SchoolSubject } from './types';
import { SCHOOL_SUBJECTS } from './types';

export interface SchoolAction {
  id: string;
  name: string; // button label
  log: string; // past-tense life-log line
  happiness?: number;
  smarts?: number;
  attendance?: number;
  behavior?: number;
  socialProgress?: number;
  teacherRelationship?: number;
  learning?: number; // applied uniformly across all 9 subjects
}

export const SCHOOL_ACTIONS: SchoolAction[] = [
  { id: 'raise_hand', name: 'Raise Your Hand', log: 'Raised your hand to answer a question.', teacherRelationship: 6, behavior: 3 },
  { id: 'clean_classroom', name: 'Help Clean the Classroom', log: 'Helped clean up the classroom.', teacherRelationship: 8, behavior: 4 },
  { id: 'share_crayons', name: 'Share Your Crayons', log: 'Shared your crayons with a classmate.', socialProgress: 5, happiness: 2 },
  { id: 'sit_quietly', name: 'Sit Quietly During the Lesson', log: 'Sat quietly during the lesson.', behavior: 6, teacherRelationship: 2 },
  { id: 'ask_question', name: 'Ask the Teacher a Question', log: 'Asked your teacher a thoughtful question.', teacherRelationship: 5, smarts: 1 },
  { id: 'line_leader', name: 'Volunteer to Be Line Leader', log: 'Volunteered to be line leader.', behavior: 5, teacherRelationship: 4 },
  { id: 'daydream', name: 'Daydream During Class', log: 'Daydreamed through most of class.', learning: -4, happiness: 2 },
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
  },
  { id: 'tattle', name: 'Tattle on a Classmate', log: 'Tattled on a classmate.', teacherRelationship: 3, socialProgress: -8 },
  { id: 'make_class_laugh', name: 'Make the Whole Class Laugh', log: 'Made the whole class laugh.', happiness: 8, socialProgress: 8, behavior: -5 },
  { id: 'color_outside_lines', name: 'Color Outside the Lines on Purpose', log: 'Colored outside the lines on purpose.', happiness: 3, behavior: -3 },
  { id: 'practice_handwriting', name: 'Practice Your Handwriting', log: 'Practiced your handwriting extra carefully.', learning: 6 },
  { id: 'read_quietly', name: 'Read a Book Quietly', log: 'Read a book quietly in the corner.', learning: 6, behavior: 2 },
  {
    id: 'tantrum',
    name: 'Throw a Tantrum',
    log: 'Threw a tantrum in the middle of class.',
    happiness: -5,
    behavior: -15,
    teacherRelationship: -8,
    socialProgress: -5,
  },
  { id: 'give_teacher_apple', name: 'Give Your Teacher an Apple', log: 'Gave your teacher an apple.', teacherRelationship: 10, happiness: 1 },
  { id: 'nap_through_storytime', name: 'Nap Through Storytime', log: 'Napped through storytime.', behavior: -4, happiness: 2 },
  { id: 'organize_toys', name: 'Organize the Toy Bin', log: 'Organized the toy bin without being asked.', behavior: 5, teacherRelationship: 3 },
  { id: 'cut_in_line', name: 'Cut in Line', log: 'Cut in line at recess.', socialProgress: -6, behavior: -4 },
  { id: 'compliment_classmate', name: 'Compliment a Classmate', log: 'Complimented a classmate.', socialProgress: 6, happiness: 2 },
  { id: 'refuse_to_share', name: 'Refuse to Share', log: 'Refused to share with the other kids.', socialProgress: -8, behavior: -3 },
  {
    id: 'lead_group_activity',
    name: 'Lead a Group Activity',
    log: 'Led a group activity in class.',
    socialProgress: 10,
    teacherRelationship: 5,
    behavior: 3,
  },
  { id: 'fake_sick', name: 'Pretend to Be Sick to Stay Home', log: 'Pretended to be sick to stay home.', attendance: -10, happiness: 5 },
  { id: 'stay_focused', name: 'Stay Extra Focused on Lessons', log: 'Stayed extra focused on every lesson.', learning: 8, smarts: 1 },
  { id: 'doodle_instead', name: 'Doodle Instead of Working', log: 'Doodled instead of doing your work.', learning: -3, happiness: 2 },
  { id: 'apologize', name: 'Apologize After a Mistake', log: 'Apologized after making a mistake.', teacherRelationship: 5, behavior: 3 },
  { id: 'show_off_recess', name: 'Show Off at Recess', log: 'Showed off at recess.', socialProgress: 5, happiness: 3, behavior: -2 },
  { id: 'hide_during_group', name: 'Hide During Group Activities', log: 'Hid during a group activity.', socialProgress: -10, happiness: -2 },
  { id: 'bring_treats', name: 'Bring Treats to Share', log: 'Brought treats to share with the class.', socialProgress: 10, happiness: 4 },
  {
    id: 'stand_up_for_classmate',
    name: 'Stand Up for a Classmate',
    log: 'Stood up for a classmate who needed help.',
    socialProgress: 8,
    behavior: 2,
    teacherRelationship: 3,
  },
  {
    id: 'throw_food',
    name: 'Throw Food in the Cafeteria',
    log: 'Threw food in the cafeteria.',
    behavior: -12,
    teacherRelationship: -6,
    happiness: 4,
    socialProgress: 3,
  },
];

const STAT_LABELS: { key: keyof SchoolAction; label: string }[] = [
  { key: 'happiness', label: 'Happiness' },
  { key: 'smarts', label: 'Smarts' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'behavior', label: 'Behavior' },
  { key: 'socialProgress', label: 'Social' },
  { key: 'teacherRelationship', label: 'Teacher' },
  { key: 'learning', label: 'Learning' },
];

// A short "Happiness +12 · Attendance -15" style summary of an action's effects.
export function describeSchoolAction(action: SchoolAction): string {
  return STAT_LABELS.filter(({ key }) => action[key])
    .map(({ key, label }) => {
      const v = action[key] as number;
      return `${label} ${v > 0 ? '+' : ''}${v}`;
    })
    .join(' · ');
}

export function schoolActionToEffects(action: SchoolAction): Effects {
  const subjects = action.learning
    ? (Object.fromEntries(SCHOOL_SUBJECTS.map((s) => [s, action.learning])) as Partial<Record<SchoolSubject, number>>)
    : undefined;

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
      subjects,
    },
  };
}
