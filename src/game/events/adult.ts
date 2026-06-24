import type { GameEvent } from '../types';

export const adultEvents: GameEvent[] = [
  {
    id: 'college',
    once: true,
    condition: (c) => c.age >= 18 && c.age <= 19,
    text: () => 'You got into college. Tuition is steep, though.',
    choices: [
      {
        text: 'Enroll (cost: $20k)',
        result: 'You are now a college student.',
        effects: { smarts: 10, money: -20000, happiness: 4, log: 'Enrolled in college.' },
      },
      {
        text: 'Skip college, start working',
        result: 'You jump straight into the workforce.',
        effects: { money: 5000, job: 'Entry-level Worker', log: 'Skipped college to work.' },
      },
    ],
  },
  {
    id: 'job_offer',
    condition: (c) => c.age >= 20 && c.age <= 60 && !c.job,
    weight: 1.4,
    text: () => 'A company offers you a full-time position.',
    choices: [
      {
        text: 'Accept the offer',
        result: 'You start your new career.',
        effects: { money: 8000, happiness: 5, job: 'Office Associate', log: 'Started a new job.' },
      },
      { text: 'Hold out for something better', effects: { happiness: -3, money: -500 } },
    ],
  },
  {
    id: 'promotion',
    condition: (c) => c.age >= 22 && c.age <= 60 && !!c.job && c.stats.smarts > 50,
    weight: 0.7,
    text: (c) => `Your manager is impressed with your work as a ${c.job}. A promotion is on the table.`,
    choices: [
      {
        text: 'Take on more responsibility',
        result: 'Promotion granted. Bigger paycheck!',
        effects: { money: 12000, happiness: 6, smarts: 2, log: 'Got promoted at work.' },
      },
      { text: 'Decline, keep work-life balance', effects: { happiness: 4, health: 3 } },
    ],
  },
  {
    id: 'salary',
    condition: (c) => c.age >= 18 && !!c.job,
    weight: 2,
    text: (c) => `Another year of work as a ${c.job}.`,
    choices: [
      { text: 'Collect your salary', effects: { money: 35000, log: 'Earned a yearly salary.' } },
    ],
  },
  {
    id: 'lottery',
    condition: (c) => c.age >= 18,
    weight: 0.15,
    text: () => 'You bought a lottery ticket on a whim.',
    choices: [
      {
        text: 'Check the numbers',
        result: 'Incredibly, you won!',
        effects: { money: 50000, happiness: 15, log: 'Won the lottery!' },
      },
    ],
  },
  {
    id: 'health_scare',
    condition: (c) => c.age >= 40,
    weight: 0.5,
    text: () => 'You have not been feeling well lately. The doctor recommends a checkup.',
    choices: [
      {
        text: 'Get the checkup',
        result: 'Caught an issue early. Good call.',
        effects: { health: 5, money: -800, log: 'Had a health checkup.' },
      },
      {
        text: 'Ignore it',
        result: 'You hope it goes away on its own.',
        effects: { health: -10, log: 'Ignored a health warning.' },
      },
    ],
  },
];
