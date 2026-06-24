import { useState, useEffect, useCallback } from 'react';
import type { Character, GameEvent, Choice, StatKey } from './game/types';
import type { CharacterCreationInput } from './game/character';
import { createCharacter, applyEffects, clamp } from './game/character';
import { naturalAging, rollDeath, ageRelatives } from './game/engine';
import { pickEvent } from './game/events';
import { saveGame, loadGame, clearSave } from './game/save';

interface GameState {
  character: Character | null;
  // The event currently awaiting a player choice, if any.
  pendingEvent: GameEvent | null;
  // Flavor text shown after a choice is made.
  lastResult: string | null;
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    character: null,
    pendingEvent: null,
    lastResult: null,
  });
  // Tracks which "once" events have already fired this life.
  const [firedOnce, setFiredOnce] = useState<Set<string>>(new Set());

  // Load any existing save on first mount.
  useEffect(() => {
    const save = loadGame();
    if (save) {
      setState({ character: save.character, pendingEvent: null, lastResult: null });
      setFiredOnce(new Set(save.firedOnce));
    }
  }, []);

  // Persist whenever the character changes.
  useEffect(() => {
    if (state.character) {
      saveGame({ character: state.character, firedOnce: [...firedOnce] });
    }
  }, [state.character, firedOnce]);

  const startNewLife = useCallback((input?: CharacterCreationInput) => {
    clearSave();
    const fresh = new Set<string>();
    setFiredOnce(fresh);
    setState({ character: createCharacter(input), pendingEvent: null, lastResult: null });
  }, []);

  // Permanently deletes the current character and save data.
  const deleteCharacter = useCallback(() => {
    clearSave();
    setFiredOnce(new Set());
    setState({ character: null, pendingEvent: null, lastResult: null });
  }, []);

  // Advance one year: age, drift stats, check death, maybe fire an event.
  const ageUp = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;

      let c: Character = { ...prev.character, age: prev.character.age + 1 };
      c = naturalAging(c);
      c = ageRelatives(c);

      // Death check happens before events — no events after death.
      const cause = rollDeath(c);
      if (cause) {
        c = {
          ...c,
          alive: false,
          causeOfDeath: cause,
          log: [...c.log, { age: c.age, text: `Died of ${cause} at age ${c.age}.` }],
        };
        return { character: c, pendingEvent: null, lastResult: null };
      }

      const event = pickEvent(c, firedOnce);
      return { character: c, pendingEvent: event, lastResult: null };
    });
  }, [firedOnce]);

  // Resolve the player's choice for the pending event.
  const chooseOption = useCallback((choice: Choice) => {
    setState((prev) => {
      if (!prev.character || !prev.pendingEvent) return prev;
      const updated = applyEffects(prev.character, choice.effects);
      if (prev.pendingEvent.once) {
        setFiredOnce((s) => new Set(s).add(prev.pendingEvent!.id));
      }
      return {
        character: updated,
        pendingEvent: null,
        lastResult: choice.result ?? null,
      };
    });
  }, []);

  // ===== Family interactions =====

  const interactWithRelative = useCallback((relativeId: string, action: 'talk' | 'spendTime' | 'giveMoney') => {
    setState((prev) => {
      if (!prev.character) return prev;
      const c = prev.character;
      const relative = c.relatives.find((r) => r.id === relativeId);
      if (!relative || !relative.alive) return prev;
      if (action === 'talk' && relative.talkedThisYear) return prev;
      if (action === 'spendTime' && relative.spentTimeThisYear) return prev;
      if (action === 'giveMoney' && relative.gaveMoneyThisYear) return prev;

      let relationshipDelta = 0;
      let happinessDelta = 0;
      let moneyDelta = 0;
      let logText = '';
      let flag: 'talkedThisYear' | 'spentTimeThisYear' | 'gaveMoneyThisYear';

      if (action === 'talk') {
        relationshipDelta = 5;
        happinessDelta = 1;
        flag = 'talkedThisYear';
        logText = `Talked with ${relative.name}.`;
      } else if (action === 'spendTime') {
        relationshipDelta = 10;
        happinessDelta = 3;
        flag = 'spentTimeThisYear';
        logText = `Spent quality time with ${relative.name}.`;
      } else {
        const amount = Math.min(100, c.money);
        if (amount <= 0) return prev;
        moneyDelta = -amount;
        relationshipDelta = 15;
        happinessDelta = 2;
        flag = 'gaveMoneyThisYear';
        logText = `Gave $${amount} to ${relative.name}.`;
      }

      const relatives = c.relatives.map((r) =>
        r.id === relativeId ? { ...r, [flag]: true, relationship: clamp(r.relationship + relationshipDelta) } : r
      );

      return {
        ...prev,
        character: {
          ...c,
          relatives,
          money: c.money + moneyDelta,
          stats: { ...c.stats, happiness: clamp(c.stats.happiness + happinessDelta) },
          log: [...c.log, { age: c.age, text: logText }],
        },
      };
    });
  }, []);

  // ===== Admin overrides =====

  const setStat = useCallback((key: StatKey, value: number) => {
    setState((prev) => {
      if (!prev.character) return prev;
      return { ...prev, character: { ...prev.character, stats: { ...prev.character.stats, [key]: clamp(value) } } };
    });
  }, []);

  const setMoney = useCallback((value: number) => {
    setState((prev) => {
      if (!prev.character) return prev;
      return { ...prev, character: { ...prev.character, money: value } };
    });
  }, []);

  const setJob = useCallback((value: string | null) => {
    setState((prev) => {
      if (!prev.character) return prev;
      return { ...prev, character: { ...prev.character, job: value } };
    });
  }, []);

  // Force the current life to end immediately, bypassing normal play.
  const endCharacter = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;
      const c = prev.character;
      return {
        ...prev,
        pendingEvent: null,
        character: {
          ...c,
          alive: false,
          causeOfDeath: 'admin override',
          log: [...c.log, { age: c.age, text: `${c.name} was ended by admin override at age ${c.age}.` }],
        },
      };
    });
  }, []);

  return {
    character: state.character,
    pendingEvent: state.pendingEvent,
    lastResult: state.lastResult,
    startNewLife,
    deleteCharacter,
    ageUp,
    chooseOption,
    interactWithRelative,
    setStat,
    setMoney,
    setJob,
    endCharacter,
  };
}
