import type { GameEvent } from '../types';

export const KINDERGARTEN_REPEAT_EVENT_ID = 'kindergarten_repeat_decision';
export const MOVE_ON_CHOICE_TEXT = 'Move on anyway';
export const REPEAT_CHOICE_TEXT = 'Repeat kindergarten';
export const SWITCH_SCHOOL_CHOICE_TEXT = 'Switch school and repeat';

// Special-cased in the UI: none of these choices resolve through the normal
// Effects pipeline (see resolveKindergartenRepeatChoice in store.ts) because
// each does something Effects can't express — clear the school year, reset
// it for a repeat, or generate an entirely new school.
export const KINDERGARTEN_REPEAT_EVENT: GameEvent = {
  id: KINDERGARTEN_REPEAT_EVENT_ID,
  condition: () => true,
  text: () => 'Your teacher recommends repeating kindergarten.',
  choices: [
    { text: MOVE_ON_CHOICE_TEXT, effects: {} },
    { text: REPEAT_CHOICE_TEXT, effects: {} },
    { text: SWITCH_SCHOOL_CHOICE_TEXT, effects: {} },
  ],
};
