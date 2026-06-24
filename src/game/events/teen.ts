import type { GameEvent } from '../types';

export const teenEvents: GameEvent[] = [
  {
    id: 'study_or_party',
    condition: (c) => c.age >= 13 && c.age <= 17,
    weight: 1.2,
    text: () => 'Big exam tomorrow, but there is also a party tonight. What do you do?',
    choices: [
      {
        text: 'Study hard',
        result: 'You aced the exam.',
        effects: { smarts: 6, happiness: -2, log: 'Studied instead of partying.' },
      },
      {
        text: 'Go to the party',
        result: 'You had a blast but bombed the test.',
        effects: { happiness: 8, smarts: -3, log: 'Chose the party over studying.' },
      },
    ],
  },
  {
    id: 'sports_team',
    once: true,
    condition: (c) => c.age >= 14 && c.age <= 17 && c.stats.health > 45,
    text: () => 'Tryouts for the school sports team are this week.',
    choices: [
      {
        text: 'Try out',
        result: 'You made the team!',
        effects: { health: 7, happiness: 5, looks: 3, log: 'Joined a school sports team.' },
      },
      { text: 'Skip it', effects: { happiness: -1 } },
    ],
  },
  {
    id: 'first_crush',
    once: true,
    condition: (c) => c.age >= 15 && c.age <= 17,
    text: () => 'You have a crush on someone in your class. Do you ask them out?',
    choices: [
      {
        text: 'Ask them out',
        result: 'They said yes! You are dating now.',
        effects: { happiness: 10, looks: 2, log: 'Started dating your first crush.' },
      },
      {
        text: 'Stay quiet',
        result: 'You never found out what could have been.',
        effects: { happiness: -4 },
      },
    ],
  },
  {
    id: 'part_time_job',
    once: true,
    condition: (c) => c.age >= 16 && c.age <= 17,
    text: () => 'The local diner is hiring part-time. Want a job?',
    choices: [
      {
        text: 'Take the job',
        result: 'You earn a bit of cash on weekends.',
        effects: { money: 1500, happiness: -2, job: 'Diner Server', log: 'Got a part-time job at a diner.' },
      },
      { text: 'Enjoy your free time', effects: { happiness: 3 } },
    ],
  },
];
