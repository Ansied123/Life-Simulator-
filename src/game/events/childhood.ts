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
  {
    id: 'first_steps',
    once: true,
    condition: (c) => c.age >= 1 && c.age <= 2,
    weight: 0.7,
    text: () => 'You took your first wobbly steps across the room. Everyone gasped like you just won a marathon.',
    choices: [
      { text: 'Totter proudly', effects: { happiness: 4, health: 1, log: 'Took your first wobbly steps.' } },
      { text: 'Chase a toy', effects: { happiness: 3, health: -1, smarts: 1, log: 'Chased a toy on your very first steps.' } },
    ],
  },
  {
    id: 'toy_taste_test',
    condition: (c) => c.age >= 0 && c.age <= 2,
    weight: 0.15,
    text: () => 'You decided to put a plastic dinosaur in your mouth. It did not taste like chicken.',
    choices: [
      { text: 'Spit it out', effects: { health: 1, smarts: 1, log: 'Wisely spit out a plastic dinosaur.' } },
      { text: 'Keep chewing', effects: { happiness: 1, health: -2, log: 'Kept chewing on a plastic dinosaur anyway.' } },
    ],
  },
  {
    id: 'peekaboo_breakthrough',
    once: true,
    condition: (c) => c.age >= 0 && c.age <= 2,
    weight: 0.6,
    text: () => 'During peekaboo, you realized your parent did not actually disappear. This is a major scientific discovery.',
    choices: [
      { text: 'Laugh hysterically', effects: { happiness: 5, log: 'Had a peekaboo breakthrough and laughed hysterically.' } },
      { text: 'Study the trick', effects: { smarts: 3, happiness: 1, log: 'Studied the peekaboo trick very seriously.' } },
    ],
  },
  {
    id: 'puddle_kingdom',
    condition: (c) => c.age >= 2 && c.age <= 5,
    weight: 0.3,
    text: () => 'You found a huge puddle after the rain. It looks like a kingdom waiting to be conquered.',
    choices: [
      { text: 'Stomp in it', effects: { happiness: 4, health: -1, looks: -1, log: 'Conquered a puddle by stomping right in.' } },
      { text: 'Walk around it', effects: { looks: 1, happiness: -1, log: 'Carefully walked around a puddle.' } },
      { text: 'Touch the water carefully', effects: { smarts: 1, happiness: 1, log: 'Carefully touched the water in a puddle.' } },
    ],
  },
  {
    id: 'crayon_masterpiece',
    once: true,
    condition: (c) => c.age >= 2 && c.age <= 4,
    weight: 0.55,
    text: () => "You drew a beautiful crayon mural on the wall. Your parents are calling it 'property damage.'",
    choices: [
      { text: 'Show it proudly', effects: { happiness: 3, smarts: 1, log: 'Showed off your crayon mural proudly.' } },
      { text: 'Try to wipe it off', effects: { smarts: 2, happiness: -1, log: 'Tried to wipe your crayon mural off the wall.' } },
      { text: 'Blame the wall', effects: { happiness: 1, smarts: -1, log: 'Blamed the wall for your crayon mural.' } },
    ],
  },
  {
    id: 'haircut_incident',
    once: true,
    condition: (c) => c.age >= 3 && c.age <= 5,
    weight: 0.5,
    text: () => 'You got a haircut, and something went terribly wrong near the bangs.',
    choices: [
      { text: 'Cry about it', effects: { happiness: -3, looks: -2, log: 'Cried over a botched haircut.' } },
      { text: 'Pretend it looks cool', effects: { happiness: 2, looks: -1, log: 'Pretended a botched haircut looked cool.' } },
      { text: 'Wear a hat', effects: { happiness: 1, looks: 1, log: 'Wore a hat to hide a botched haircut.' } },
    ],
  },
  {
    id: 'imaginary_friend',
    once: true,
    condition: (c) => c.age >= 3 && c.age <= 5,
    weight: 0.65,
    text: () => 'You made an imaginary friend. They are invisible, mysterious, and apparently very opinionated.',
    choices: [
      { text: 'Play with them', effects: { happiness: 3, smarts: 2, log: 'Played with your new imaginary friend.' } },
      { text: 'Ignore them', effects: { happiness: -1, log: 'Ignored your imaginary friend.' } },
      { text: 'Tell your parents all about them', effects: { happiness: 2, log: 'Told your parents all about your imaginary friend.' } },
    ],
  },
  {
    id: 'big_kid_cup',
    once: true,
    condition: (c) => c.age >= 2 && c.age <= 4,
    weight: 0.75,
    text: () => 'You were given a real cup instead of a sippy cup. This is a dangerous promotion.',
    choices: [
      { text: 'Drink carefully', effects: { smarts: 2, happiness: 1, log: 'Drank carefully from your first big-kid cup.' } },
      { text: 'Spill everywhere', effects: { happiness: -1, looks: -1, log: 'Spilled your big-kid cup everywhere.' } },
      { text: 'Celebrate too early', effects: { happiness: 2, health: -1, log: 'Celebrated your big-kid cup a little too early.' } },
    ],
  },
  {
    id: 'stuffed_animal_surgery',
    once: true,
    condition: (c) => c.age >= 3 && c.age <= 5,
    weight: 0.45,
    text: () => 'Your favorite stuffed animal ripped open. Fluff is everywhere. This is an emergency.',
    choices: [
      { text: 'Ask for help fixing it', effects: { happiness: 2, smarts: 1, log: 'Got help fixing your favorite stuffed animal.' } },
      { text: 'Try to fix it yourself', effects: { smarts: 3, happiness: -1, log: 'Tried to perform surgery on your stuffed animal yourself.' } },
      { text: 'Throw a funeral', effects: { happiness: -2, smarts: 1, log: 'Held a funeral for your stuffed animal.' } },
    ],
  },
  {
    id: 'mystery_bug',
    condition: (c) => c.age >= 2 && c.age <= 5,
    weight: 0.3,
    text: () => 'You found a tiny bug crawling near the window. It may be a friend. It may be a monster.',
    choices: [
      { text: 'Watch it closely', effects: { smarts: 2, log: 'Watched a mystery bug very closely.' } },
      { text: 'Scream', effects: { happiness: -2, health: 1, log: 'Screamed at a mystery bug.' } },
      { text: 'Try to pick it up', effects: { happiness: 1, health: -1, smarts: 1, log: 'Tried to pick up a mystery bug.' } },
    ],
  },
  {
    id: 'dress_up_disaster',
    condition: (c) => c.age >= 3 && c.age <= 5,
    weight: 0.3,
    text: () => 'You got into a pile of clothes and created a bold new outfit. Fashion may never recover.',
    choices: [
      { text: 'Wear it proudly', effects: { happiness: 3, looks: 1, log: 'Proudly wore your bold new dress-up outfit.' } },
      { text: 'Change back', effects: { looks: 1, log: 'Changed back out of your dress-up outfit.' } },
      { text: 'Add even more clothes', effects: { happiness: 4, looks: -1, log: 'Added even more clothes to your dress-up outfit.' } },
    ],
  },
  {
    id: 'bedtime_rebellion',
    condition: (c) => c.age >= 2 && c.age <= 5,
    weight: 0.45,
    text: () => 'It is bedtime, but you are not done being alive today.',
    choices: [
      { text: 'Go to sleep', effects: { health: 2, happiness: -1, log: 'Went to bed without a fight.' } },
      { text: 'Ask for one more story', effects: { happiness: 2, smarts: 1, health: -1, log: 'Got one more bedtime story.' } },
      { text: 'Refuse loudly', effects: { happiness: 1, health: -2, looks: -1, log: 'Refused bedtime loudly.' } },
    ],
  },
];
