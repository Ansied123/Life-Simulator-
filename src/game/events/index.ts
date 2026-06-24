import type { Character, GameEvent } from '../types';
import { childhoodEvents } from './childhood';
import { teenEvents } from './teen';
import { adultEvents } from './adult';
import { familyEventCandidates } from './family';

// All events in one pool. Add new event files here.
const ALL_EVENTS: GameEvent[] = [
  ...childhoodEvents,
  ...teenEvents,
  ...adultEvents,
];

// Picks one eligible event for this character, respecting weights and
// the set of already-fired "once" events. Returns null if none apply.
export function pickEvent(c: Character, firedOnce: Set<string>): GameEvent | null {
  const candidates = ALL_EVENTS.filter((e) => e.condition(c)).concat(familyEventCandidates(c));
  const eligible = candidates.filter((e) => !(e.once && firedOnce.has(e.id)));
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const e of eligible) {
    roll -= e.weight ?? 1;
    if (roll <= 0) return e;
  }
  return eligible[eligible.length - 1];
}
