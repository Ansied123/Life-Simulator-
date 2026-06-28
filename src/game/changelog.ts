// The full version history shown on the Changelog page.
//
// Convention going forward:
// - Every shipped change gets an entry here, no exceptions.
// - New entries go at the TOP of CHANGELOG (newest first).
// - A focused patch/fix bumps the third number off the current version
//   (1.5 -> 1.5.1 -> 1.5.2 -> ...). A meaningful new feature set bumps the
//   second number (1.5 -> 1.6) and resets the patch number.
// - Keep APP_VERSION in App.tsx in sync with CHANGELOG[0].version.
export interface ChangelogSection {
  heading: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  sections: ChangelogSection[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.5',
    sections: [
      {
        heading: 'Kindergarten Basics',
        items: [
          'Added a floating alert when a kindergarten enrollment happens, dismissed with a Confirm button.',
          'School Actions no longer have a separate "Do It" button — clicking the action itself performs it and returns you to the Life Record.',
          'All 30 School Actions now have a chance of fizzling or backfiring based on your current stats, instead of always succeeding.',
          'Failed classmate interactions now also lower Social Progress.',
          'Flavor/detail text in the Life Record now shows as a normal second line instead of italics.',
          'School Details is folded by default, and the School tab uses slightly smaller fonts throughout.',
        ],
      },
      {
        heading: 'Best Friends',
        items: [
          'Reaching Best Friend status (relationship 80+) now turns the status label and relationship bar gold.',
          'The "asks you to be best friends" event now guarantees you actually reach Best Friend status.',
          'Being Best Friends with a classmate halves the chance of a falling-out with them.',
          'Added 3 Best-Friend-only events: Secret Handshake, Best Friend Sick Day, Friendship Jealousy.',
        ],
      },
      {
        heading: 'Monthly Focus',
        items: [
          'Kindergarteners now have a limited Monthly Focus budget (4 points) shared across Study, School Actions, classmate interactions, Ask Parent for Help, and Rest at Home — you can no longer do everything in one month.',
          'Added "Ask Parent for Help" (boosts your weakest subject, scaled by Parent Help Level) and "Rest at Home" (+2 health, +1 happiness).',
        ],
      },
      {
        heading: 'Temperament & School Culture',
        items: [
          'Every child now gets a semi-visible Temperament at enrollment — Curious, Shy, Energetic, Sensitive, or Bold — each changing how studying, social actions, and risk all play out.',
          'Every school now has a visible Culture — Academic-Focused, Play-Based, Strict Discipline, Creative Environment, Underfunded, or Elite Reputation — shown with a one-line tagline in School Details.',
        ],
      },
      {
        heading: 'Teacher Personality',
        items: [
          'Teacher personality is now slowly discoverable: occasional Life Record hints describe how your teacher behaves without ever showing the underlying number.',
          'Added 6 one-time events tied to each teacher personality (Kind, Strict, Funny, Patient, Serious, Energetic).',
        ],
      },
      {
        heading: 'Classmates',
        items: [
          'Every classmate now has a fixed personality Archetype — Bossy, Quiet, Wild, Sweet, Popular, or Tough — shown in the Classmates tab, each changing how interacting with them feels.',
          'Added live Reputation Tags shown as chips in the School tab — Teacher\'s Helper, Playground Leader, Little Artist, Trouble Magnet — that come and go with your current stats.',
        ],
      },
      {
        heading: 'Study & Balance',
        items: [
          'Studying a subject is no longer a flat +8: the gain now depends on Parent Help Level, Teacher Relationship, your happiness/health, and how close that subject already is to mastered.',
          'Stats across the board (subjects, behavior, social progress, teacher relationship, attendance, classmate relationships) get harder to push higher once they pass 70, and harder still past 90.',
          'Low health or happiness now have real downsides: smaller study gains, a higher chance of School Action backfires and classmate falling-outs, and occasional unavoidable attendance dips.',
          'Added study-flavored mini-events (Counting Mix-Up, Parent Practice Letters) and "hard to keep perfect attendance" events (Mild Cold, Snow Day, Overslept).',
        ],
      },
      {
        heading: 'Withdrawal & Repeat Kindergarten',
        items: [
          'Reworked automatic withdrawal into a fair 3-stage escalation — a quiet Warning, then an Intervention (a parent-teacher support meeting), and only then a real chance of withdrawal — with 7 specific reasons instead of 2.',
          'Not being promoted to Grade 1 is now an actual decision: Move On Anyway, Repeat Kindergarten (same school, new teacher and classmates), or Switch Schools and Repeat.',
        ],
      },
      {
        heading: 'Goals & Awards',
        items: [
          'Every kindergarten year now generates 3 mini-goals (a little tailored to your temperament and school culture), shown with live checkmarks in the School tab.',
          'Meeting any goal by year\'s end now rewards happiness and Parent Satisfaction, and shows up on your progress report.',
          'Every award now has a real flavor "moment" plus happiness, Parent Satisfaction, and Teacher Relationship rewards when earned.',
          'Added 2 new awards — Class Clown Ribbon and Quiet Achiever — that naturally can\'t be earned alongside some existing awards, so different kids collect different sets.',
        ],
      },
      {
        heading: 'New Events & Memories',
        items: [
          'Added 15 new random kindergarten events: home-school connection moments, mixed/negative dilemmas with real tradeoffs, Best-Friend-only moments, and a handful of genuinely rare flavor events.',
          'Added Kindergarten Milestone Memories — First Best Friend, Loved Reading Early, Kindergarten Stage Fright, Playground Bully Memory — kept as permanent keepsakes, two of which can be revisited and overcome years later as a teenager.',
        ],
      },
    ],
  },
];
