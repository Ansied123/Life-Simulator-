import type { GameEvent } from '../types';

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { question: 'What does a red octagonal (eight-sided) sign mean?', choices: ['Yield', 'Stop', 'Merge', 'Do not enter'], correctIndex: 1 },
  { question: 'What does a steady yellow traffic light mean?', choices: ['Speed up to clear the intersection', 'Prepare to stop, the light is about to turn red', 'Stop immediately', 'Proceed with right of way'], correctIndex: 1 },
  { question: 'Unless posted otherwise, what is the typical speed limit in residential areas?', choices: ['15 mph', '25 mph', '45 mph', '55 mph'], correctIndex: 1 },
  { question: 'At a four-way stop, if two cars arrive at the same time, who has the right of way?', choices: ['The car on the left', 'The car going straight', 'The car on the right', 'Whoever honks first'], correctIndex: 2 },
  { question: 'What does a solid yellow line on your side of the road mean?', choices: ['Passing is allowed', 'No passing', 'Parking is allowed', 'One-way street'], correctIndex: 1 },
  { question: 'How far before a turn should you signal?', choices: ['Right as you turn', 'At least 100 feet before turning', '10 feet before turning', "Signaling isn't necessary if no cars are around"], correctIndex: 1 },
  { question: 'What color are most warning signs?', choices: ['Red', 'Blue', 'Yellow', 'Green'], correctIndex: 2 },
  { question: 'What should you do at a flashing red light?', choices: ['Speed through', 'Stop, then proceed when safe', 'Slow down only', 'Ignore it'], correctIndex: 1 },
  { question: 'What should you do at a flashing yellow light?', choices: ['Stop completely', 'Slow down and proceed with caution', 'Speed up', 'Turn around'], correctIndex: 1 },
  { question: 'What is the legal blood alcohol limit for most drivers 21 and over in the US?', choices: ['0.08%', '0.05%', '0.10%', '0.02%'], correctIndex: 0 },
  { question: 'If your car starts to skid, what should you do?', choices: ['Slam the brakes', 'Steer in the direction of the skid', 'Steer opposite the skid', 'Accelerate'], correctIndex: 1 },
  { question: 'What is a safe following distance under normal conditions?', choices: ['1 second', '3-4 seconds', '10 seconds', 'As close as possible'], correctIndex: 1 },
  { question: 'What does a white rectangular sign with black text usually indicate?', choices: ['A warning', 'A regulation or rule', 'A landmark', 'A scenic route'], correctIndex: 1 },
  { question: 'What does a diamond-shaped sign usually indicate?', choices: ['Stop ahead', 'A warning of a hazard ahead', 'A speed limit', 'No parking'], correctIndex: 1 },
  { question: 'When parking uphill next to a curb, which way should your front wheels point?', choices: ['Toward the curb', 'Away from the curb', 'Straight ahead', "It doesn't matter"], correctIndex: 1 },
  { question: 'When parking downhill next to a curb, which way should your front wheels point?', choices: ['Toward the curb', 'Away from the curb', 'Straight ahead', "It doesn't matter"], correctIndex: 0 },
  { question: 'Using hand signals, how do you indicate a left turn?', choices: ['Left arm pointed down', 'Left arm straight out', 'Right arm straight out', 'Left arm bent upward'], correctIndex: 1 },
  { question: 'What should you do when an emergency vehicle approaches with lights and sirens on?', choices: ['Speed up to get out of the way', 'Pull over to the right and stop', 'Stop immediately in your lane', 'Ignore it if you have the right of way'], correctIndex: 1 },
  { question: 'What should you do when a school bus has its red lights flashing and stop sign extended?', choices: ['Slow down and pass carefully', 'Stop in both directions', 'Only stop if behind the bus', 'Honk and pass'], correctIndex: 1 },
  { question: 'How far must you park from a fire hydrant in most areas?', choices: ['5 feet', '15 feet', '30 feet', '50 feet'], correctIndex: 1 },
  { question: 'What is hydroplaning?', choices: ['Driving too fast on a highway', 'Loss of tire traction on a wet road', 'A type of tire', 'A braking technique'], correctIndex: 1 },
  { question: 'If your brakes fail, what should you do?', choices: ['Turn off the engine immediately', 'Pump the brakes and shift to a lower gear', 'Jump out of the car', 'Accelerate to find a safe place to stop'], correctIndex: 1 },
  { question: 'When is it generally legal to pass another vehicle on the right?', choices: ['Never', 'When the car ahead is turning left', 'On any two-lane road', "When you're in a hurry"], correctIndex: 1 },
  { question: 'What does a green arrow next to a red light mean?', choices: ['Stop completely', 'You may turn in the direction of the arrow', 'Wait for the light to turn green', 'Proceed straight only'], correctIndex: 1 },
  { question: 'What is the main purpose of anti-lock brakes (ABS)?', choices: ['Increase top speed', 'Prevent wheels from locking up during hard braking', 'Improve fuel economy', 'Reduce tire wear'], correctIndex: 1 },
  { question: 'What should you do before changing lanes?', choices: ['Speed up first', 'Check mirrors and blind spots, then signal', 'Honk your horn', "Just signal, no need to check"], correctIndex: 1 },
  { question: 'A pentagon-shaped traffic sign typically indicates what?', choices: ['A school zone', 'A hospital', 'A railroad crossing', 'A construction zone'], correctIndex: 0 },
  { question: 'In poor weather, what should you do to your following distance?', choices: ['Decrease it', 'Increase it', 'Keep it the same', "It doesn't matter"], correctIndex: 1 },
  { question: 'What lights should you use when driving in fog?', choices: ['High beams', 'Low beam headlights', 'Hazard lights only', 'No lights'], correctIndex: 1 },
  { question: 'At an uncontrolled intersection with no signs, who generally has the right of way?', choices: ['The faster car', 'The car that arrives first', 'The car on the left', 'Whoever is bigger'], correctIndex: 1 },
  { question: 'When merging onto a highway, what should you do?', choices: ['Stop at the end of the ramp', 'Match the speed of traffic and merge safely', 'Merge as slowly as possible', 'Flash your lights at other cars'], correctIndex: 1 },
  { question: 'What does a circular sign with a red slash through a symbol mean?', choices: ['That action is required', 'That action is prohibited', 'A warning only', 'A speed limit'], correctIndex: 1 },
  { question: 'What is the proper way to handle a tire blowout while driving?', choices: ['Slam the brakes immediately', 'Ease off the gas and steer straight', 'Turn sharply to the shoulder', 'Accelerate to maintain control'], correctIndex: 1 },
  { question: 'When should you turn your headlights on?', choices: ['Only at midnight', 'From sunset to sunrise, or in low visibility', 'Only on highways', "Headlights aren't required at night if streetlights are on"], correctIndex: 1 },
  { question: 'What does "defensive driving" mean?', choices: ['Driving aggressively to assert right of way', 'Anticipating hazards and driving cautiously', 'Driving only in defense of traffic tickets', 'Tailgating to keep pace with traffic'], correctIndex: 1 },
  { question: 'What is the main danger of tailgating?', choices: ['Higher fuel consumption', 'Not enough time and space to react or stop', "It's illegal in all states", 'It damages your tires'], correctIndex: 1 },
  { question: 'At a railroad crossing with flashing lights, what should you do?', choices: ['Speed up to cross before the train', 'Stop and wait for the train to pass', 'Honk and proceed', 'Go around the gate carefully'], correctIndex: 1 },
  { question: 'What does a single broken (dashed) yellow line mean?', choices: ['No passing ever', 'Passing is allowed when safe', 'One-way traffic', 'Pedestrian crossing'], correctIndex: 1 },
  { question: 'What do two solid yellow lines in the middle of the road mean?', choices: ['Passing allowed in one direction', 'No passing in either direction', 'Bike lane ahead', 'Merge lane'], correctIndex: 1 },
  { question: 'What is a typical speed limit in a school zone when children are present?', choices: ['15-25 mph', '45 mph', '55 mph', 'No limit'], correctIndex: 0 },
  { question: 'What should new drivers especially avoid while driving?', choices: ['Checking mirrors', 'Using a cell phone', 'Wearing a seatbelt', 'Signaling turns'], correctIndex: 1 },
  { question: 'What is the main purpose of a roundabout?', choices: ['To keep traffic flowing without stopping', 'To force all cars to stop', 'To create a shortcut', 'To replace stop signs only at night'], correctIndex: 0 },
  { question: 'In a roundabout, who generally has the right of way?', choices: ['Vehicles entering the roundabout', 'Vehicles already in the roundabout', 'The largest vehicle', 'Whoever signals first'], correctIndex: 1 },
  { question: 'What does a "No U-Turn" sign indicate?', choices: ['U-turns are required', 'U-turns are not allowed', 'U-turns are allowed only at night', 'U-turns are allowed only for trucks'], correctIndex: 1 },
  { question: 'How should you respond to a yellow diamond sign showing a curve ahead?', choices: ['Maintain current speed', 'Slow down for the upcoming curve', 'Speed up to get through it', 'Switch lanes immediately'], correctIndex: 1 },
  { question: 'If your check engine light comes on while driving, what should you do?', choices: ['Ignore it', 'Have the vehicle inspected soon', 'Pull over and abandon the car', 'Turn off the engine immediately while driving'], correctIndex: 1 },
  { question: 'What is the safest way to handle road rage from another driver?', choices: ['Confront them at the next light', 'Stay calm and avoid engaging', 'Match their aggression', 'Brake suddenly to teach them a lesson'], correctIndex: 1 },
  { question: 'If you start to feel drowsy while driving, what should you do?', choices: ['Turn up the radio and keep going', 'Pull over and rest', 'Open the window and continue', 'Drive faster to get home sooner'], correctIndex: 1 },
  { question: 'What is the proper response to a pedestrian in a crosswalk?', choices: ['Honk and proceed', 'Stop and let them cross', 'Speed up to pass before them', 'Swerve around them'], correctIndex: 1 },
  { question: 'What does a steady green traffic light mean?', choices: ['Stop and check for cross traffic', 'Proceed if the intersection is clear', 'Yield only', 'Prepare to stop'], correctIndex: 1 },
];

// Picks 10 unique random questions for one test attempt.
export function pickQuizQuestions(): QuizQuestion[] {
  const pool = [...QUIZ_QUESTIONS];
  const picked: QuizQuestion[] = [];
  for (let i = 0; i < 10 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export const DRIVERS_LICENSE_EVENT_ID = 'drivers_license_test';
export const TAKE_TEST_CHOICE_TEXT = 'Take the Test';

// This event is special-cased in the UI: choosing "Take the Test" launches a
// 10-question quiz instead of resolving immediately through normal effects.
export const DRIVERS_LICENSE_EVENT: GameEvent = {
  id: DRIVERS_LICENSE_EVENT_ID,
  condition: () => true,
  text: () => "Your parents think it's time you got your driver's license. Do you want to take the test?",
  choices: [
    { text: 'Ignore it', effects: { log: "Decided not to get a driver's license yet." } },
    { text: TAKE_TEST_CHOICE_TEXT, effects: {} },
  ],
};
