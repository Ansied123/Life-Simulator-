import type { Character, Choice, GameEvent, Relative, RelativeRole } from '../types';

function livingParents(c: Character): Relative[] {
  return c.relatives.filter((r) => r.alive && (r.role === 'mother' || r.role === 'father'));
}

function livingRelatives(c: Character): Relative[] {
  return c.relatives.filter((r) => r.alive);
}

// ===== Per-relative templates: instantiated once for each eligible relative =====

interface FamilyTemplate {
  id: string;
  weight?: number;
  roles?: RelativeRole[]; // eligible relative roles; omit for any
  minAge?: number; // character age lower bound; defaults to 5
  maxAge?: number; // character age upper bound; omit for none
  once?: boolean; // fires at most once per relative, per life
  requiresAlive?: boolean; // defaults to true; set false to target a deceased relative (e.g. inheritance)
  eligible?: (r: Relative, c: Character) => boolean; // extra filter on the matched relative
  text: (r: Relative, c: Character) => string;
  choices: (r: Relative, c: Character) => Choice[];
}

const FAMILY_TEMPLATES: FamilyTemplate[] = [
  {
    id: 'family_call',
    minAge: 18,
    text: (r) => `${r.name} calls just to catch up. How do you respond?`,
    choices: (r) => [
      {
        text: 'Talk for hours',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 8 }], happiness: 3, log: `Caught up with ${r.name} for hours.` },
      },
      {
        text: 'Keep it short',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 2 }], log: `Had a quick chat with ${r.name}.` },
      },
      {
        text: 'Let it go to voicemail',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -6 }], happiness: -2, log: `Ignored a call from ${r.name}.` },
      },
    ],
  },
  {
    id: 'family_favor',
    roles: ['mother', 'father'],
    text: (r) => `${r.name} asks for help with a big chore this weekend.`,
    choices: (r) => [
      {
        text: 'Spend the weekend helping out',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 10 }], happiness: 2, log: `Spent the weekend helping ${r.name}.` },
      },
      {
        text: 'Help for an hour, then leave',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 3 }], log: `Helped ${r.name} for a bit.` },
      },
      {
        text: 'Say you are too busy',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -8 }], happiness: -3, log: `Turned down ${r.name}'s request for help.` },
      },
    ],
  },
  {
    id: 'family_money_ask',
    minAge: 18,
    text: (r) => `${r.name} is a little short on cash this month and hints at needing help.`,
    choices: (r) => [
      {
        text: 'Send $500',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 12 }], happiness: 2, money: -500, log: `Sent $500 to ${r.name}.` },
      },
      {
        text: 'Send what you can spare ($100)',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 5 }], money: -100, log: `Sent $100 to ${r.name}.` },
      },
      {
        text: 'Say you cannot help right now',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -5 }], log: `Turned down ${r.name}'s request for money.` },
      },
    ],
  },
  {
    id: 'family_argument',
    text: (r) => `You and ${r.name} get into a heated argument over something small.`,
    choices: (r) => [
      {
        text: 'Apologize and make up',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 4 }], happiness: 1, log: `Made up with ${r.name} after an argument.` },
      },
      {
        text: 'Give the silent treatment',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -10 }], happiness: -4, log: `Gave ${r.name} the silent treatment.` },
      },
    ],
  },
  {
    id: 'family_gathering',
    text: (r) => `${r.name} invites you to a family gathering.`,
    choices: (r) => [
      {
        text: 'Go and enjoy the time together',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 6 }], happiness: 5, log: `Had a great time with ${r.name} at a family gathering.` },
      },
      {
        text: 'Skip it',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -4 }], happiness: -1, log: `Skipped a family gathering, missing ${r.name}.` },
      },
    ],
  },
  {
    id: 'sibling_rivalry',
    roles: ['sibling'],
    minAge: 6,
    text: (r) => `Your sibling, ${r.name}, broke something of yours and blamed you. Your parents are deciding who to believe.`,
    choices: (r, c) => {
      const parents = livingParents(c);
      return [
        {
          text: 'Defend yourself loudly',
          result: 'Your parents believed you over your sibling.',
          effects: {
            happiness: 3,
            relativeEffects: [
              { relativeId: r.id, relationship: -10 },
              ...parents.map((p) => ({ relativeId: p.id, relationship: -3 })),
            ],
            log: `Defended yourself against ${r.name}'s accusation.`,
          },
        },
        {
          text: 'Take the blame to keep the peace',
          effects: {
            happiness: -4,
            relativeEffects: [
              { relativeId: r.id, relationship: 12 },
              ...parents.map((p) => ({ relativeId: p.id, relationship: 5 })),
            ],
            log: `Took the blame to keep peace with ${r.name}.`,
          },
        },
        {
          text: 'Stay silent',
          result: 'No one is satisfied.',
          effects: { happiness: -2, log: 'Stayed silent during a family dispute.' },
        },
      ];
    },
  },
  {
    id: 'inheritance',
    roles: ['mother', 'father'],
    requiresAlive: false,
    minAge: 18,
    once: true,
    text: () => "A late parent's estate is settled. You receive a modest inheritance.",
    choices: (r) => [
      {
        text: 'Continue',
        effects: {
          money: 2000 + Math.floor(Math.random() * 13001),
          happiness: 5,
          log: `Inherited money from ${r.name}.`,
        },
      },
    ],
  },
  {
    id: 'caring_for_parent',
    roles: ['mother', 'father'],
    minAge: 30,
    eligible: (r) => r.age >= 65,
    text: (r) => `Your aging parent, ${r.name}, needs help around the house more often.`,
    choices: (r) => [
      {
        text: 'Take care of them yourself',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 15 }], happiness: -3, money: -500, log: `Took care of ${r.name} yourself.` },
      },
      {
        text: 'Hire help instead',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 5 }], money: -3000, log: `Hired help for ${r.name}.` },
      },
      {
        text: 'Say you are too busy',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -12 }], happiness: -4, log: `Told ${r.name} you were too busy to help.` },
      },
    ],
  },
  {
    id: 'sibling_favor',
    roles: ['sibling'],
    minAge: 16,
    text: (r) => `Your sibling, ${r.name}, needs to crash at your place for a while.`,
    choices: (r) => [
      {
        text: 'Let them stay',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 12 }], happiness: -2, log: `Let ${r.name} stay with you for a while.` },
      },
      {
        text: 'Say no',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -8 }], log: `Turned down ${r.name}'s request to stay with you.` },
      },
    ],
  },
  {
    id: 'reconnect',
    minAge: 20,
    eligible: (r) => r.relationship < 25,
    text: (r) => `You haven't spoken to ${r.name} in a long time. They reach out.`,
    choices: (r) => [
      {
        text: 'Make amends',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: 20 }], happiness: 6, log: `Reconnected with ${r.name}.` },
      },
      {
        text: 'Ignore the call',
        effects: { relativeEffects: [{ relativeId: r.id, relationship: -10 }], happiness: -2, log: `Ignored a call from ${r.name}.` },
      },
    ],
  },
];

// ===== Family-scope templates: instantiated once for the whole family =====

interface FamilyScopeTemplate {
  id: string;
  weight?: number;
  minAge?: number;
  maxAge?: number;
  once?: boolean;
  eligible: (c: Character) => boolean;
  text: (c: Character) => string;
  choices: (c: Character) => Choice[];
}

const FAMILY_SCOPE_TEMPLATES: FamilyScopeTemplate[] = [
  {
    id: 'family_secret',
    minAge: 14,
    once: true,
    eligible: (c) => livingParents(c).length >= 2,
    text: () => 'You overhear your parents arguing about something they have kept from you.',
    choices: (c) => {
      const parents = livingParents(c);
      return [
        {
          text: 'Confront them',
          result: 'The truth comes out.',
          effects: {
            happiness: -6,
            smarts: 2,
            relativeEffects: parents.map((p) => ({ relativeId: p.id, relationship: -5 })),
            log: 'Confronted your parents about their secret.',
          },
        },
        {
          text: "Pretend you didn't hear",
          effects: { happiness: -3, log: 'Pretended not to hear your parents arguing.' },
        },
      ];
    },
  },
  {
    id: 'family_vacation',
    minAge: 5,
    maxAge: 17,
    weight: 0.3,
    eligible: (c) => livingParents(c).length >= 1,
    text: () => 'Your family takes a trip together.',
    choices: (c) => [
      {
        text: 'Continue',
        effects: {
          happiness: 10,
          health: 2,
          relativeEffects: livingRelatives(c).map((r) => ({ relativeId: r.id, relationship: 5 })),
          log: 'Went on a family vacation.',
        },
      },
    ],
  },
];

// Instantiates one GameEvent per (template, eligible relative) pair for
// per-relative templates, plus one GameEvent per eligible family-scope
// template. Weight is split across eligible relatives so a big family
// doesn't crowd out every other event in the pool.
export function familyEventCandidates(c: Character): GameEvent[] {
  const candidates: GameEvent[] = [];

  for (const t of FAMILY_TEMPLATES) {
    if (c.age < (t.minAge ?? 5)) continue;
    if (t.maxAge !== undefined && c.age > t.maxAge) continue;

    const requiresAlive = t.requiresAlive ?? true;
    const pool = c.relatives.filter(
      (r) => r.alive === requiresAlive && (!t.roles || t.roles.includes(r.role)) && (!t.eligible || t.eligible(r, c))
    );
    if (pool.length === 0) continue;

    const weight = (t.weight ?? 1) / pool.length;
    for (const r of pool) {
      candidates.push({
        id: `${t.id}:${r.id}`,
        condition: () => true,
        text: () => t.text(r, c),
        choices: t.choices(r, c),
        weight,
        once: t.once,
      });
    }
  }

  for (const t of FAMILY_SCOPE_TEMPLATES) {
    if (c.age < (t.minAge ?? 5)) continue;
    if (t.maxAge !== undefined && c.age > t.maxAge) continue;
    if (!t.eligible(c)) continue;

    candidates.push({
      id: t.id,
      condition: () => true,
      text: () => t.text(c),
      choices: t.choices(c),
      weight: t.weight ?? 1,
      once: t.once,
    });
  }

  return candidates;
}
