import { useState, useEffect, useCallback } from 'react';
import type { Character, GameEvent, Choice, StatKey, Item } from './game/types';
import type { CharacterCreationInput } from './game/character';
import { createCharacter, applyEffects, clamp } from './game/character';
import { naturalAging, rollDeath, ageRelatives } from './game/engine';
import { rollAdditionalSiblings } from './game/family';
import { pickEvent } from './game/events';
import { DRIVERS_LICENSE_EVENT } from './game/events/drivers';
import { MONTHS_PER_YEAR } from './game/calendar';
import type { ShopItem } from './game/shop';
import { saveGame, loadGame, clearSave, getLivesLived, incrementLivesLived } from './game/save';

const LICENSE_OFFER_CHANCE = 0.7;

interface GameState {
  character: Character | null;
  // The event currently awaiting a player choice, if any.
  pendingEvent: GameEvent | null;
  // Flavor text shown after a choice is made.
  lastResult: string | null;
}

// Shared by ageUp (ages 0-4) and nextMonth's year-wrap (age 5+): ages the
// character a full year, ticks relatives, rolls death, and picks an event.
function advanceYear(c: Character, firedOnce: Set<string>): { character: Character; pendingEvent: GameEvent | null } {
  let updated: Character = { ...c, age: c.age + 1, month: 0 };
  updated = naturalAging(updated);
  updated = ageRelatives(updated);
  updated = rollAdditionalSiblings(updated);

  const cause = rollDeath(updated);
  if (cause) {
    return {
      character: {
        ...updated,
        alive: false,
        causeOfDeath: cause,
        log: [...updated.log, { age: updated.age, text: `Died of ${cause} at age ${updated.age}.` }],
      },
      pendingEvent: null,
    };
  }

  // The driver's license offer is a once-in-a-lifetime, age-16-only check:
  // 70% of the time it's guaranteed to show that year, 30% it never appears.
  if (updated.age === 16 && Math.random() < LICENSE_OFFER_CHANCE) {
    return { character: updated, pendingEvent: DRIVERS_LICENSE_EVENT };
  }

  return { character: updated, pendingEvent: pickEvent(updated, firedOnce) };
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    character: null,
    pendingEvent: null,
    lastResult: null,
  });
  // Tracks which "once" events have already fired this life.
  const [firedOnce, setFiredOnce] = useState<Set<string>>(new Set());
  const [livesLived, setLivesLived] = useState<number>(getLivesLived);

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
    setLivesLived(incrementLivesLived());
  }, []);

  // Permanently deletes the current character and save data.
  const deleteCharacter = useCallback(() => {
    clearSave();
    setFiredOnce(new Set());
    setState({ character: null, pendingEvent: null, lastResult: null });
  }, []);

  // Advance one full year (ages 0-4, before monthly mode kicks in).
  const ageUp = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;
      const { character, pendingEvent } = advanceYear(prev.character, firedOnce);
      return { character, pendingEvent, lastResult: null };
    });
  }, [firedOnce]);

  // Advance one month (age 5+). Wraps into a full advanceYear once 12
  // months have passed since the last birthday.
  const nextMonth = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;
      const c = prev.character;
      if (c.month + 1 >= MONTHS_PER_YEAR) {
        const { character, pendingEvent } = advanceYear(c, firedOnce);
        return { character, pendingEvent, lastResult: null };
      }
      return { character: { ...c, month: c.month + 1 }, pendingEvent: null, lastResult: null };
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

  // Resolves the driver's license test: adds the item to the inventory on a
  // pass (8/10 or better), just logs the outcome on a fail.
  const resolveLicenseTest = useCallback((score: number, passed: boolean) => {
    setState((prev) => {
      if (!prev.character) return prev;
      const c = prev.character;
      const log = [
        ...c.log,
        {
          age: c.age,
          text: passed
            ? `Passed the driving test with a score of ${score}/10 and got a driver's license!`
            : `Failed the driving test with a score of ${score}/10.`,
        },
      ];
      const inventory: Item[] = passed
        ? [...c.inventory, { id: 'drivers_license', name: "Driver's License", icon: '🪪', acquiredAge: c.age }]
        : c.inventory;

      return { character: { ...c, inventory, log }, pendingEvent: null, lastResult: null };
    });
  }, []);

  // ===== Shopping =====

  const buyItem = useCallback((item: ShopItem) => {
    setState((prev) => {
      if (!prev.character || prev.character.money < item.price) return prev;
      const c = prev.character;
      const newItem: Item = { id: `${item.id}-${c.inventory.length}`, name: item.name, icon: item.icon, acquiredAge: c.age };
      return {
        ...prev,
        character: {
          ...c,
          money: c.money - item.price,
          inventory: [...c.inventory, newItem],
          log: [...c.log, { age: c.age, text: `Bought ${item.name} for $${item.price.toLocaleString()}.` }],
        },
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
    livesLived,
    startNewLife,
    deleteCharacter,
    ageUp,
    nextMonth,
    chooseOption,
    interactWithRelative,
    resolveLicenseTest,
    buyItem,
    setStat,
    setMoney,
    setJob,
    endCharacter,
  };
}
