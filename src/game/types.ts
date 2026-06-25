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
  // A short log of life events, newest last.
  log: LogEntry[];
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  description?: string;
  acquiredAge: number;
}

export interface LogEntry {
  age: number;
  text: string;
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
  // Whether each yearly interaction has already been used this year.
  talkedThisYear: boolean;
  spentTimeThisYear: boolean;
  gaveMoneyThisYear: boolean;
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
  // Relationship deltas applied to specific relatives, by id.
  relativeEffects?: { relativeId: string; relationship: number }[];
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
