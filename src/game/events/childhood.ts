import type { GameEvent } from '../types';

// Events that fire during early childhood. Pure data: to add more,
// just append objects to this array.
export const childhoodEvents: GameEvent[] = [
  {
    id: 'first_word',
    once: true,
    condition: (c) => c.age >= 1 && c.age <= 3,
    text: () => 'You said your first word today. Your parents are thrilled.',
    choices: [
      { text: 'Continue', effects: { happiness: 5, log: 'Said your first word.' } },
    ],
  },
  {
    id: 'lost_tooth',
    condition: (c) => c.age >= 6 && c.age <= 8,
    weight: 0.6,
    text: () => 'You lost a tooth! Do you tell your parents about the tooth fairy?',
    choices: [
      { text: 'Put it under the pillow', effects: { money: 2, happiness: 4, log: 'The tooth fairy visited.' } },
      { text: 'Swallow it by accident', effects: { happiness: -3, log: 'You swallowed a baby tooth. Oops.' } },
    ],
  },
  {
    id: 'sick',
    condition: (c) => c.age >= 2 && c.age <= 11,
    weight: 0.12,
    text: () => 'You came down with a nasty flu.',
    choices: [
      { text: 'Rest in bed', effects: { health: -4, log: 'You were sick with the flu.' } },
    ],
  },
];
