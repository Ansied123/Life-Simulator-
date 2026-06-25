import type { Character, Choice, Classmate, GameEvent } from '../types';

const KINDER_WEIGHT = 2.5;

// The school record only exists while actively enrolled (it's cleared every
// May, win or lose), so this alone is enough to scope events to kindergarten.
function isKindergartener(c: Character): boolean {
  return c.school !== null && c.school.grade === 'K';
}

// ===== Generic kindergarten events (no specific classmate involved) =====

interface KinderTemplate {
  id: string;
  weight?: number;
  once?: boolean;
  eligible?: (c: Character) => boolean; // extra condition beyond being a kindergartener
  text: (c: Character) => string;
  choices: (c: Character) => Choice[];
}

const KINDER_TEMPLATES: KinderTemplate[] = [
  {
    id: 'show_and_tell',
    text: () => "It's Show and Tell day. Do you bring something special?",
    choices: () => [
      {
        text: 'Bring your favorite toy',
        result: 'The class loved it!',
        effects: { schoolEffects: { socialProgress: 8 }, happiness: 3, log: 'Brought your favorite toy for Show and Tell.' },
      },
      {
        text: 'Skip your turn',
        effects: { schoolEffects: { socialProgress: -3 }, happiness: -1, log: 'Skipped your turn at Show and Tell.' },
      },
    ],
  },
  {
    id: 'nap_time_mischief',
    text: () => "It's nap time, but you're wide awake.",
    choices: () => [
      {
        text: 'Lie down like everyone else',
        effects: { schoolEffects: { behavior: 5 }, log: 'Behaved well during nap time.' },
      },
      {
        text: 'Whisper and giggle with friends',
        effects: { schoolEffects: { behavior: -8, socialProgress: 4 }, log: 'Got chatty during nap time.' },
      },
    ],
  },
  {
    id: 'coloring_contest',
    text: () => 'Your class is having a coloring contest.',
    choices: () => [
      {
        text: 'Try your best',
        effects: { schoolEffects: { subjects: { Art: 10 } }, happiness: 2, log: 'Tried hard in the coloring contest.' },
      },
      {
        text: 'Doodle randomly',
        effects: { schoolEffects: { subjects: { Art: 2 } }, log: 'Doodled during the coloring contest.' },
      },
    ],
  },
  {
    id: 'letter_of_the_day',
    weight: KINDER_WEIGHT,
    text: () => "Today's lesson is all about a new letter of the alphabet.",
    choices: () => [
      {
        text: 'Continue',
        effects: { schoolEffects: { subjects: { 'Writing Letters': 6 } }, smarts: 1, log: 'Learned a new letter.' },
      },
    ],
  },
  {
    id: 'counting_game',
    weight: KINDER_WEIGHT,
    text: () => 'The class plays a counting game with blocks.',
    choices: () => [
      {
        text: 'Continue',
        effects: { schoolEffects: { subjects: { 'Counting & Numbers': 6 } }, smarts: 1, log: 'Practiced counting with blocks.' },
      },
    ],
  },
  {
    id: 'storytime',
    text: () => 'Your teacher gathers the class for storytime.',
    choices: () => [
      {
        text: 'Listen closely',
        effects: {
          schoolEffects: { subjects: { 'Listening Skills': 8 }, teacherRelationship: 3 },
          log: 'Listened closely during storytime.',
        },
      },
      {
        text: 'Get distracted',
        effects: {
          schoolEffects: { subjects: { 'Listening Skills': -3 }, teacherRelationship: -2 },
          log: 'Got distracted during storytime.',
        },
      },
    ],
  },
  {
    id: 'field_trip_zoo',
    weight: 1.5,
    text: () => 'Your class goes on a field trip to the zoo!',
    choices: () => [
      {
        text: 'Have an amazing time',
        result: 'You saw lions, giraffes, and made it back just in time for the bus.',
        effects: {
          schoolEffects: { socialProgress: 12, behavior: 5, attendance: 2 },
          happiness: 15,
          log: 'Had an amazing time on the zoo field trip.',
        },
      },
    ],
  },
  {
    id: 'caught_misbehaving',
    weight: 1.5,
    text: () => 'You got caught misbehaving in class.',
    choices: () => [
      {
        text: 'Apologize',
        effects: { schoolEffects: { behavior: 3, teacherRelationship: 2 }, log: 'Apologized after misbehaving in class.' },
      },
      {
        text: 'Argue back',
        effects: {
          schoolEffects: { behavior: -15, teacherRelationship: -10 },
          happiness: -3,
          log: 'Argued with your teacher after getting caught misbehaving.',
        },
      },
    ],
  },
  {
    id: 'kinder_sick_day',
    text: () => 'You woke up with a sore throat and a runny nose.',
    choices: () => [
      {
        text: 'Continue',
        effects: { schoolEffects: { attendance: -10 }, health: -3, log: 'Stayed home from school feeling sick.' },
      },
    ],
  },
  {
    id: 'perfect_attendance',
    once: true,
    weight: 1.5,
    eligible: (c) => (c.school?.attendance ?? 0) >= 90,
    text: () => 'Your teacher announces you have perfect attendance this term!',
    choices: () => [
      {
        text: 'Continue',
        result: 'You get a shiny gold star sticker.',
        effects: {
          schoolEffects: { attendance: 5, teacherRelationship: 8, socialProgress: 5 },
          happiness: 10,
          log: 'Recognized for perfect attendance.',
        },
      },
    ],
  },
  {
    id: 'class_pet_day',
    text: () => 'The class hamster visits your table today.',
    choices: () => [
      {
        text: 'Continue',
        effects: {
          schoolEffects: { subjects: { 'Sharing & Cooperation': 5 }, socialProgress: 3 },
          happiness: 6,
          log: 'The class hamster visited your table.',
        },
      },
    ],
  },
  {
    id: 'talent_show',
    weight: 1.5,
    text: () => "It's the kindergarten talent show. Do you perform?",
    choices: () => [
      {
        text: 'Perform confidently',
        result: 'The class cheered for you!',
        effects: {
          schoolEffects: { socialProgress: 15, subjects: { Music: 8 } },
          happiness: 12,
          log: 'Performed confidently in the talent show.',
        },
      },
      {
        text: 'Get stage fright',
        effects: { schoolEffects: { socialProgress: -6 }, happiness: -8, log: 'Got stage fright at the talent show.' },
      },
    ],
  },
  {
    id: 'teachers_pet_moment',
    text: () => 'Your teacher praises your hard work in front of the whole class.',
    choices: () => [
      {
        text: 'Continue',
        effects: {
          schoolEffects: { teacherRelationship: 10, socialProgress: 4 },
          happiness: 5,
          log: 'Your teacher praised you in front of the class.',
        },
      },
    ],
  },
];

// ===== Classmate-specific kindergarten events =====

interface ClassmateTemplate {
  id: string;
  weight?: number;
  once?: boolean;
  eligible?: (cm: Classmate) => boolean;
  text: (cm: Classmate) => string;
  choices: (cm: Classmate) => Choice[];
}

const CLASSMATE_TEMPLATES: ClassmateTemplate[] = [
  {
    id: 'lunchbox_swap',
    text: (cm) => `${cm.name} offers to swap lunches with you.`,
    choices: (cm) => [
      {
        text: 'Swap happily',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: 10 }],
          schoolEffects: { socialProgress: 3 },
          happiness: 2,
          log: `Swapped lunches with ${cm.name}.`,
        },
      },
      {
        text: 'Decline politely',
        effects: { classmateEffects: [{ classmateId: cm.id, relationship: -2 }], log: `Declined to swap lunches with ${cm.name}.` },
      },
    ],
  },
  {
    id: 'playground_conflict',
    weight: 1.5,
    text: (cm) => `${cm.name} pushes you on the playground!`,
    choices: (cm) => [
      {
        text: 'Tell the teacher',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: -10 }],
          schoolEffects: { teacherRelationship: 5, behavior: 2 },
          log: `Told the teacher after ${cm.name} pushed you.`,
        },
      },
      {
        text: 'Push back',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: -20 }],
          schoolEffects: { behavior: -15, socialProgress: -5 },
          happiness: -5,
          log: `Pushed ${cm.name} back on the playground.`,
        },
      },
      {
        text: 'Walk away',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: -5 }],
          schoolEffects: { behavior: 3 },
          log: `Walked away after ${cm.name} pushed you.`,
        },
      },
    ],
  },
  {
    id: 'new_best_friend',
    weight: 1.2,
    eligible: (cm) => cm.relationship < 70,
    text: (cm) => `${cm.name} asks you to be best friends!`,
    choices: (cm) => [
      {
        text: 'Continue',
        result: 'You shake on it. Best friends forever!',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: 30 }],
          schoolEffects: { socialProgress: 10 },
          happiness: 8,
          log: `${cm.name} became your best friend!`,
        },
      },
    ],
  },
];

// Instantiates one GameEvent per (generic template) plus one per (classmate
// template, eligible classmate). Weight on classmate templates is split
// across eligible classmates, same approach as the family event system.
export function schoolEventCandidates(c: Character): GameEvent[] {
  if (!isKindergartener(c)) return [];
  const candidates: GameEvent[] = [];

  for (const t of KINDER_TEMPLATES) {
    if (t.eligible && !t.eligible(c)) continue;
    candidates.push({
      id: t.id,
      condition: () => true,
      text: () => t.text(c),
      choices: t.choices(c),
      weight: t.weight ?? KINDER_WEIGHT,
      once: t.once,
    });
  }

  const classmates = c.school?.classmates ?? [];
  for (const t of CLASSMATE_TEMPLATES) {
    const pool = classmates.filter((cm) => !t.eligible || t.eligible(cm));
    if (pool.length === 0) continue;
    const weight = (t.weight ?? KINDER_WEIGHT) / pool.length;
    for (const cm of pool) {
      candidates.push({
        id: `${t.id}:${cm.id}`,
        condition: () => true,
        text: () => t.text(cm),
        choices: t.choices(cm),
        weight,
        once: t.once,
      });
    }
  }

  return candidates;
}
