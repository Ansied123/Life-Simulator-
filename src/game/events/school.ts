import type { Character, Choice, Classmate, GameEvent } from '../types';
import { BEST_FRIEND_THRESHOLD } from '../school';
import { cultureEventWeightMultiplier } from '../schoolTraits';
import { archetypeConflictEventWeightMultiplier } from '../classmateArchetypes';
import { tagEventWeightMultiplier } from '../reputationTags';

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

  // ===== Teacher-personality-specific moments (each only fires for a
  // matching hidden personality, once per life — they're part of how that
  // personality shows up beyond its stat multiplier). =====
  {
    id: 'kind_teacher_support',
    once: true,
    weight: 1.5,
    eligible: (c) => c.school?.teacher.personality === 'Kind',
    text: () => 'Your teacher noticed you looked nervous and helped you join the group.',
    choices: () => [
      {
        text: 'Accept the help',
        effects: {
          schoolEffects: { teacherRelationship: 4, socialProgress: 3 },
          happiness: 2,
          log: "Accepted your teacher's help joining the group.",
        },
      },
      {
        text: 'Stay quiet',
        effects: { schoolEffects: { teacherRelationship: 1 }, happiness: -1, log: 'Stayed quiet instead of joining the group.' },
      },
    ],
  },
  {
    id: 'strict_teacher_warning',
    once: true,
    weight: 1.5,
    eligible: (c) => c.school?.teacher.personality === 'Strict',
    text: () => 'You were warned for talking during circle time.',
    choices: () => [
      {
        text: 'Apologize',
        effects: { schoolEffects: { behavior: 2, teacherRelationship: 1 }, log: 'Apologized for talking during circle time.' },
      },
      {
        text: 'Keep talking',
        effects: { schoolEffects: { behavior: -5 }, happiness: 1, log: 'Kept talking anyway during circle time.' },
      },
      {
        text: 'Cry',
        effects: { schoolEffects: { teacherRelationship: 2 }, happiness: -2, log: 'Cried after being warned during circle time.' },
      },
    ],
  },
  {
    id: 'funny_teacher_laughter',
    once: true,
    weight: 1.5,
    eligible: (c) => c.school?.teacher.personality === 'Funny',
    text: () => 'Your teacher made the whole class laugh during storytime.',
    choices: () => {
      const jokeBackfired = Math.random() < 0.4;
      return [
        {
          text: 'Laugh along',
          effects: { schoolEffects: { teacherRelationship: 1 }, happiness: 3, log: 'Laughed along during storytime.' },
        },
        {
          text: 'Make your own joke',
          effects: {
            schoolEffects: { socialProgress: 2, behavior: jokeBackfired ? -4 : 0 },
            happiness: 2,
            log: jokeBackfired
              ? 'Made your own joke, but it threw off the rest of storytime.'
              : 'Made your own joke and the class loved it.',
          },
        },
      ];
    },
  },
  {
    id: 'patient_teacher_second_chance',
    once: true,
    weight: 1.5,
    eligible: (c) => c.school?.teacher.personality === 'Patient',
    text: () => 'You got an answer wrong, but your teacher gave you another try instead of moving on.',
    choices: () => [
      {
        text: 'Try again carefully',
        effects: { schoolEffects: { teacherRelationship: 4 }, smarts: 1, log: 'Tried again carefully after getting it wrong.' },
      },
      {
        text: 'Feel embarrassed and stay quiet',
        effects: {
          schoolEffects: { teacherRelationship: 1 },
          happiness: -1,
          log: 'Felt embarrassed and stayed quiet after getting it wrong.',
        },
      },
    ],
  },
  {
    id: 'serious_teacher_focus',
    once: true,
    weight: 1.5,
    eligible: (c) => c.school?.teacher.personality === 'Serious',
    text: () => 'Your teacher ran an extra serious lesson today and expected everyone to stay on task.',
    choices: () => [
      {
        text: 'Focus hard',
        effects: { schoolEffects: { teacherRelationship: 2 }, smarts: 1, log: 'Focused hard through an extra serious lesson.' },
      },
      {
        text: 'Get bored and doodle',
        effects: {
          schoolEffects: { teacherRelationship: -3 },
          happiness: 1,
          log: 'Got bored and doodled through an extra serious lesson.',
        },
      },
    ],
  },
  {
    id: 'energetic_teacher_dance_break',
    once: true,
    weight: 1.5,
    eligible: (c) => c.school?.teacher.personality === 'Energetic',
    text: () => 'Your teacher surprised the class with an upbeat dance break between lessons.',
    choices: () => {
      const gotCarriedAway = Math.random() < 0.4;
      return [
        {
          text: 'Dance along',
          effects: { schoolEffects: { socialProgress: 2 }, happiness: 4, log: 'Danced along during the surprise dance break.' },
        },
        {
          text: 'Lead the dance',
          effects: {
            schoolEffects: { socialProgress: 4, behavior: gotCarriedAway ? -4 : 0 },
            happiness: 5,
            log: gotCarriedAway
              ? 'Led the dance and got a little too carried away.'
              : 'Led the dance and the whole class joined in.',
          },
        },
        {
          text: 'Watch from the side',
          effects: { happiness: 1, log: 'Watched the dance break from the side.' },
        },
      ];
    },
  },

  // ===== Harder-to-keep-perfect attendance, and parent help with a cost. =====
  {
    id: 'mild_cold',
    weight: 1.2,
    text: () => 'You came down with a mild cold and missed a couple of days of school.',
    choices: (c) => {
      const highHelp = (c.school?.parentHelpLevel ?? 0) >= 70;
      return [
        {
          text: 'Continue',
          effects: {
            schoolEffects: { attendance: highHelp ? 0 : -2 },
            health: -2,
            log: highHelp
              ? 'Caught a mild cold, but your parents kept you on track at home.'
              : 'Caught a mild cold and missed a couple of days of school.',
          },
        },
      ];
    },
  },
  {
    id: 'snow_day',
    weight: 1,
    text: () => 'School was canceled for a surprise snow day!',
    choices: () => [
      { text: 'Continue', effects: { happiness: 6, log: 'Enjoyed a surprise snow day off from school.' } },
    ],
  },
  {
    id: 'overslept',
    weight: 1.2,
    text: () => 'You overslept and showed up to school late.',
    choices: () => [
      {
        text: 'Continue',
        effects: {
          schoolEffects: { attendance: -3, parentSatisfaction: -2 },
          log: 'Overslept and showed up to school late.',
        },
      },
    ],
  },
  {
    id: 'counting_mixup',
    weight: 1,
    text: () => 'You were counting a pile of blocks, but kept losing track partway through.',
    choices: () => [
      {
        text: 'Start over and count carefully',
        effects: {
          schoolEffects: { subjects: { 'Counting & Numbers': 6 } },
          happiness: -1,
          log: 'Started over and counted the blocks carefully.',
        },
      },
      {
        text: 'Guess the rest',
        effects: {
          schoolEffects: { subjects: { 'Counting & Numbers': 2 } },
          happiness: 1,
          log: 'Gave up and guessed how many blocks were left.',
        },
      },
      {
        text: 'Ask a friend to help count',
        effects: {
          schoolEffects: { subjects: { 'Counting & Numbers': 4 }, socialProgress: 2 },
          log: 'Asked a friend to help count the blocks.',
        },
      },
    ],
  },
  {
    id: 'parent_practice_letters',
    weight: 1,
    eligible: (c) => (c.school?.parentHelpLevel ?? 0) >= 50,
    text: () => 'Your parent made you practice letters after dinner.',
    choices: () => [
      {
        text: 'Do it',
        effects: {
          schoolEffects: { subjects: { 'Writing Letters': 5 } },
          happiness: -1,
          log: 'Practiced letters with your parent after dinner.',
        },
      },
      {
        text: 'Complain',
        effects: {
          schoolEffects: { parentSatisfaction: -3 },
          happiness: 1,
          log: 'Complained about practicing letters after dinner.',
        },
      },
      {
        text: 'Try your best',
        effects: {
          schoolEffects: { subjects: { 'Writing Letters': 3 }, parentSatisfaction: 2 },
          log: 'Tried your best practicing letters after dinner.',
        },
      },
    ],
  },

  // ===== Home-school connection: kindergarten is not just school. =====
  {
    id: 'forgot_backpack',
    weight: 1,
    text: () => 'You arrived at school without your backpack.',
    choices: () => [
      { text: 'Laugh it off', effects: { happiness: 1, schoolEffects: { teacherRelationship: -1 }, log: 'Laughed off forgetting your backpack.' } },
      { text: 'Cry', effects: { happiness: -2, schoolEffects: { teacherRelationship: 1 }, log: 'Cried about forgetting your backpack.' } },
      {
        text: 'Parent brings it later',
        effects: {
          happiness: 1,
          schoolEffects: { attendance: -1, parentSatisfaction: -1 },
          log: 'Had a parent bring your forgotten backpack later.',
        },
      },
    ],
  },
  {
    id: 'parent_reads_with_you',
    weight: 1.2,
    eligible: (c) => c.relatives.some((r) => (r.role === 'mother' || r.role === 'father') && r.alive),
    text: () => 'One of your parents sat down to read a picture book with you.',
    choices: () => [
      {
        text: 'Listen carefully',
        effects: {
          schoolEffects: { subjects: { 'Reading Readiness': 5 }, parentSatisfaction: 3 },
          log: 'Listened carefully while a parent read a picture book with you.',
        },
      },
      { text: 'Point at pictures', effects: { smarts: 1, happiness: 2, log: 'Pointed at pictures while a parent read to you.' } },
      {
        text: 'Wiggle away',
        effects: { happiness: 1, schoolEffects: { parentSatisfaction: -2 }, log: 'Wiggled away from story time with a parent.' },
      },
    ],
  },
  {
    id: 'chaotic_morning',
    weight: 1,
    text: () => 'Everyone was late this morning. Shoes were missing. Breakfast was rushed.',
    choices: () => [
      { text: 'Rush to class', effects: { happiness: -1, schoolEffects: { attendance: -2 }, log: 'Rushed to class after a chaotic morning.' } },
      { text: 'Stay calm', effects: { happiness: 1, schoolEffects: { parentSatisfaction: 1 }, log: 'Stayed calm through a chaotic morning.' } },
      {
        text: 'Throw a tantrum',
        effects: { schoolEffects: { behavior: -3, parentSatisfaction: -4 }, log: 'Threw a tantrum during a chaotic morning.' },
      },
    ],
  },

  // ===== More mixed/negative events: not every option should be obviously
  // right, and kindergarten has its share of small dramas. =====
  {
    id: 'favorite_toy_lost',
    weight: 1,
    text: () => 'You brought your favorite toy to school, but now it is missing.',
    choices: () => {
      const recovered = Math.random() < 0.5;
      return [
        {
          text: 'Search everywhere',
          effects: {
            happiness: recovered ? 2 : -1,
            schoolEffects: { teacherRelationship: 1 },
            log: recovered ? 'Searched everywhere and found your favorite toy!' : 'Searched everywhere, but your favorite toy is still missing.',
          },
        },
        {
          text: 'Blame someone',
          effects: { schoolEffects: { socialProgress: -4, behavior: -3 }, log: 'Blamed a classmate for your missing toy.' },
        },
        { text: 'Try to forget it', effects: { happiness: -3, smarts: 1, log: 'Tried to forget about your missing toy.' } },
      ];
    },
  },
  {
    id: 'snack_envy',
    weight: 1,
    text: () => 'Another kid has a snack that looks much better than yours.',
    choices: () => {
      const tradeWorked = Math.random() < 0.5;
      return [
        {
          text: 'Ask to trade',
          effects: {
            schoolEffects: { socialProgress: tradeWorked ? 2 : -3 },
            log: tradeWorked ? 'Traded snacks and both of you were happy about it.' : 'Asked to trade snacks, and it did not go well.',
          },
        },
        { text: 'Complain', effects: { happiness: -1, schoolEffects: { behavior: -2 }, log: 'Complained about your snack.' } },
        { text: 'Eat your own snack', effects: { health: 1, happiness: -1, log: 'Ate your own snack anyway.' } },
      ];
    },
  },
  {
    id: 'circle_time_restlessness',
    weight: 1,
    text: () => 'You cannot sit still during circle time.',
    choices: () => [
      {
        text: 'Try hard to focus',
        effects: { happiness: -1, schoolEffects: { subjects: { 'Listening Skills': 4 } }, log: 'Tried hard to focus during circle time.' },
      },
      { text: 'Wiggle quietly', effects: { happiness: 1, schoolEffects: { behavior: -1 }, log: 'Wiggled quietly through circle time.' } },
      {
        text: 'Interrupt the story',
        effects: {
          happiness: 2,
          schoolEffects: { behavior: -4, teacherRelationship: -2 },
          log: 'Interrupted the story during circle time.',
        },
      },
    ],
  },
  {
    id: 'glue_disaster',
    weight: 1,
    text: () => 'You used way too much glue during art time. Your paper is now mostly glue.',
    choices: () => [
      { text: 'Call it art', effects: { happiness: 2, schoolEffects: { subjects: { Art: 3 } }, log: 'Called your glue disaster a piece of art.' } },
      {
        text: 'Ask for another paper',
        effects: { schoolEffects: { subjects: { Art: 2 }, teacherRelationship: 1 }, log: 'Asked for another paper after a glue disaster.' },
      },
      { text: 'Panic', effects: { happiness: -2, schoolEffects: { subjects: { Art: -1 } }, log: 'Panicked over a glue disaster during art time.' } },
    ],
  },
  {
    id: 'line_leader_problem',
    weight: 1,
    text: () => 'You were chosen as line leader, but someone kept stepping in front of you.',
    choices: () => [
      {
        text: 'Tell the teacher',
        effects: { schoolEffects: { teacherRelationship: 2, socialProgress: -1 }, log: 'Told the teacher about a line-leader problem.' },
      },
      { text: 'Push back', effects: { schoolEffects: { behavior: -5, socialProgress: -2 }, log: 'Pushed back over a line-leader problem.' } },
      { text: 'Ignore it', effects: { happiness: -2, schoolEffects: { behavior: 1 }, log: 'Ignored a line-leader problem.' } },
    ],
  },

  // ===== Rare life flavor: the kind of standout day that becomes a story. =====
  {
    id: 'fire_drill',
    weight: 0.5,
    text: () => 'The loud alarm went off. Everyone lined up outside for a fire drill.',
    choices: () => [
      { text: 'Stay calm', effects: { schoolEffects: { behavior: 3, teacherRelationship: 2 }, log: 'Stayed calm during a fire drill.' } },
      { text: 'Cover your ears', effects: { happiness: -2, schoolEffects: { teacherRelationship: 1 }, log: 'Covered your ears during a loud fire drill.' } },
      { text: 'Run ahead', effects: { health: -1, schoolEffects: { behavior: -4 }, log: 'Ran ahead of the line during a fire drill.' } },
    ],
  },
  {
    id: 'substitute_teacher',
    weight: 0.5,
    text: () => 'Your regular teacher was absent. A substitute teacher ran the class today.',
    choices: () => [
      {
        text: 'Behave extra well',
        effects: { schoolEffects: { behavior: 3, teacherRelationship: 1 }, log: 'Behaved extra well for the substitute teacher.' },
      },
      { text: 'Test the limits', effects: { happiness: 2, schoolEffects: { behavior: -5 }, log: 'Tested the limits with the substitute teacher.' } },
      {
        text: 'Help the substitute',
        effects: { schoolEffects: { teacherRelationship: 3, socialProgress: 1 }, log: 'Helped out the substitute teacher.' },
      },
    ],
  },
  {
    id: 'picture_day',
    weight: 0.5,
    text: () => 'It was picture day. Your parents tried very hard to fix your hair.',
    choices: () => [
      { text: 'Smile nicely', effects: { looks: 2, schoolEffects: { parentSatisfaction: 2 }, log: 'Smiled nicely for picture day.' } },
      {
        text: 'Make a weird face',
        effects: { happiness: 3, schoolEffects: { parentSatisfaction: -2 }, log: 'Made a weird face on picture day.' },
      },
      { text: 'Refuse the photo', effects: { happiness: -1, schoolEffects: { parentSatisfaction: -4 }, log: 'Refused to take the photo on picture day.' } },
    ],
  },
  {
    id: 'school_assembly',
    weight: 0.5,
    text: () => 'The whole school gathered for an assembly. It felt huge and loud.',
    choices: () => [
      { text: 'Watch quietly', effects: { schoolEffects: { subjects: { 'Listening Skills': 3 } }, log: 'Watched the school assembly quietly.' } },
      { text: 'Wave at older kids', effects: { happiness: 1, schoolEffects: { socialProgress: 2 }, log: 'Waved at older kids during the assembly.' } },
      { text: 'Get overwhelmed', effects: { happiness: -2, schoolEffects: { teacherRelationship: 1 }, log: 'Got overwhelmed during the school assembly.' } },
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
          // Guarantees Best Friend status outright, regardless of where the
          // relationship stood before.
          classmateEffects: [{ classmateId: cm.id, relationship: 10, minRelationship: BEST_FRIEND_THRESHOLD }],
          schoolEffects: { socialProgress: 10 },
          happiness: 8,
          log: `${cm.name} became your best friend!`,
        },
      },
    ],
  },

  // ===== Best Friend only: once a classmate crosses that threshold, the
  // relationship should feel like more than just a high number. =====
  {
    id: 'secret_handshake',
    weight: 1.2,
    eligible: (cm) => cm.relationship >= BEST_FRIEND_THRESHOLD,
    text: (cm) => `${cm.name} invented a secret handshake with you.`,
    choices: (cm) => [
      {
        text: 'Practice it',
        effects: { classmateEffects: [{ classmateId: cm.id, relationship: 5 }], happiness: 3, log: `Practiced your secret handshake with ${cm.name}.` },
      },
      {
        text: 'Show everyone',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: -2 }],
          schoolEffects: { socialProgress: 3 },
          log: `Showed everyone your secret handshake with ${cm.name}.`,
        },
      },
      { text: 'Forget the moves', effects: { happiness: -1, log: `Forgot the moves to your secret handshake with ${cm.name}.` } },
    ],
  },
  {
    id: 'best_friend_sick_day',
    weight: 1.2,
    eligible: (cm) => cm.relationship >= BEST_FRIEND_THRESHOLD,
    text: (cm) => `${cm.name} was absent today. School felt different.`,
    choices: (cm) => [
      {
        text: 'Miss them',
        effects: { classmateEffects: [{ classmateId: cm.id, relationship: 2 }], happiness: -2, log: `Missed ${cm.name} all day.` },
      },
      {
        text: 'Play with someone else',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: -1 }],
          schoolEffects: { socialProgress: 2 },
          log: `Played with someone else while ${cm.name} was out.`,
        },
      },
      {
        text: 'Make them a drawing',
        effects: {
          classmateEffects: [{ classmateId: cm.id, relationship: 4 }],
          schoolEffects: { subjects: { Art: 2 } },
          log: `Made ${cm.name} a drawing for when they got back.`,
        },
      },
    ],
  },
  {
    id: 'friendship_jealousy',
    weight: 1.2,
    eligible: (cm) => cm.relationship >= BEST_FRIEND_THRESHOLD,
    text: (cm) => `Another classmate wanted to play with ${cm.name}.`,
    choices: (cm) => [
      {
        text: 'Share the friendship',
        effects: { schoolEffects: { socialProgress: 4 }, happiness: 1, log: `Shared ${cm.name}'s friendship with another classmate.` },
      },
      {
        text: 'Get jealous',
        effects: { classmateEffects: [{ classmateId: cm.id, relationship: -3 }], happiness: -2, log: `Got jealous over ${cm.name} playing with someone else.` },
      },
      { text: 'Walk away', effects: { happiness: -1, smarts: 1, log: `Walked away rather than deal with feeling jealous over ${cm.name}.` } },
    ],
  },
];

// Instantiates one GameEvent per (generic template) plus one per (classmate
// template, eligible classmate). Weight on classmate templates is split
// across eligible classmates, same approach as the family event system.
export function schoolEventCandidates(c: Character): GameEvent[] {
  if (!isKindergartener(c)) return [];
  const school = c.school!;
  const candidates: GameEvent[] = [];

  for (const t of KINDER_TEMPLATES) {
    if (t.eligible && !t.eligible(c)) continue;
    candidates.push({
      id: t.id,
      condition: () => true,
      text: () => t.text(c),
      choices: t.choices(c),
      weight: (t.weight ?? KINDER_WEIGHT) * cultureEventWeightMultiplier(t.id, school.culture) * tagEventWeightMultiplier(t.id, school),
      once: t.once,
    });
  }

  const classmates = school.classmates;
  for (const t of CLASSMATE_TEMPLATES) {
    const pool = classmates.filter((cm) => !t.eligible || t.eligible(cm));
    if (pool.length === 0) continue;
    const baseWeight = t.weight ?? KINDER_WEIGHT;
    for (const cm of pool) {
      const archetypeMult = t.id === 'playground_conflict' ? archetypeConflictEventWeightMultiplier(cm.archetype) : 1;
      candidates.push({
        id: `${t.id}:${cm.id}`,
        condition: () => true,
        text: () => t.text(cm),
        choices: t.choices(cm),
        weight: (baseWeight * archetypeMult) / pool.length,
        once: t.once,
      });
    }
  }

  return candidates;
}
