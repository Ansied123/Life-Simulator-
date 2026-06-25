import { useState, useEffect, useCallback } from 'react';
import type { Character, GameEvent, Choice, StatKey, Item, SchoolSubject } from './game/types';
import type { CharacterCreationInput } from './game/character';
import { createCharacter, applyEffects, clamp } from './game/character';
import { naturalAging, rollDeath, ageRelatives } from './game/engine';
import { rollAdditionalSiblings, rollFamilyInteraction, tickFamilyMonthly, FAMILY_YOUNG_AGE_CUTOFF } from './game/family';
import {
  maybeEnrollInSchool,
  resetMonthlySchoolFlags,
  maybeAutoDropOut,
  dropOutOfSchool,
  checkSchoolAwards,
  maybeEndKindergarten,
  rollClassmateInteraction,
  updateParentInvolvement,
  parentSatisfactionRelationshipMultiplier,
} from './game/school';
import { SCHOOL_ACTIONS, schoolActionToEffects } from './game/schoolActions';
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
  // The most recent classmate interaction that triggered a conflict, if any;
  // cleared by any other state-changing action.
  lastClassmateConflict: { classmateId: string; reason: string } | null;
  // Same idea, for family interactions.
  lastFamilyConflict: { relativeId: string; reason: string } | null;
}

// Shared by ageUp (ages 0-4) and nextMonth's year-wrap (age 5+): ages the
// character a full year, ticks relatives, rolls death, and picks an event.
function advanceYear(c: Character, firedOnce: Set<string>): { character: Character; pendingEvent: GameEvent | null } {
  let updated: Character = { ...c, age: c.age + 1, month: 0 };
  updated = naturalAging(updated);
  updated = ageRelatives(updated);
  updated = rollAdditionalSiblings(updated);
  updated = tickFamilyMonthly(updated);

  const cause = rollDeath(updated);
  if (cause) {
    return {
      character: {
        ...updated,
        alive: false,
        causeOfDeath: cause,
        log: [...updated.log, { age: updated.age, month: updated.month, text: `Died of ${cause} at age ${updated.age}.`, kind: 'major' }],
      },
      pendingEvent: null,
    };
  }

  updated = maybeEnrollInSchool(updated);
  updated = checkSchoolAwards(updated);
  updated = updateParentInvolvement(updated);
  updated = maybeEndKindergarten(updated);

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
    lastClassmateConflict: null,
    lastFamilyConflict: null,
  });
  // Tracks which "once" events have already fired this life.
  const [firedOnce, setFiredOnce] = useState<Set<string>>(new Set());
  const [livesLived, setLivesLived] = useState<number>(getLivesLived);

  // Load any existing save on first mount.
  useEffect(() => {
    const save = loadGame();
    if (save) {
      setState({ character: save.character, pendingEvent: null, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null });
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
    setState({ character: createCharacter(input), pendingEvent: null, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null });
    setLivesLived(incrementLivesLived());
  }, []);

  // Permanently deletes the current character and save data.
  const deleteCharacter = useCallback(() => {
    clearSave();
    setFiredOnce(new Set());
    setState({ character: null, pendingEvent: null, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null });
  }, []);

  // Advance one full year (ages 0-4, before monthly mode kicks in).
  const ageUp = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;
      const { character, pendingEvent } = advanceYear(prev.character, firedOnce);
      return { character, pendingEvent, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null };
    });
  }, [firedOnce]);

  // Advance one month (age 5+). Wraps into a full advanceYear once 12
  // months have passed since the last birthday; otherwise just ticks the
  // month and still rolls the event pool, same as a yearly age-up did.
  const nextMonth = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;
      const c = prev.character;
      if (c.month + 1 >= MONTHS_PER_YEAR) {
        const { character, pendingEvent } = advanceYear(c, firedOnce);
        return { character: resetMonthlySchoolFlags(character), pendingEvent, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null };
      }
      let updated: Character = { ...c, month: c.month + 1 };
      // Enrollment (September) and graduation (May) are checked every month,
      // since they rarely line up with the character's own birthday.
      updated = maybeEnrollInSchool(updated);
      updated = resetMonthlySchoolFlags(updated);
      updated = tickFamilyMonthly(updated);
      updated = checkSchoolAwards(updated);
      updated = updateParentInvolvement(updated);
      updated = maybeEndKindergarten(updated);
      updated = maybeAutoDropOut(updated);
      const event = pickEvent(updated, firedOnce);
      return { character: updated, pendingEvent: event, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null };
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
        lastClassmateConflict: null,
        lastFamilyConflict: null,
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
          month: c.month,
          text: passed
            ? `Passed the driving test with a score of ${score}/10 and got a driver's license!`
            : `Failed the driving test with a score of ${score}/10.`,
        },
      ];
      const inventory: Item[] = passed
        ? [...c.inventory, { id: 'drivers_license', name: "Driver's License", icon: '🪪', acquiredAge: c.age }]
        : c.inventory;

      return { character: { ...c, inventory, log }, pendingEvent: null, lastResult: null, lastClassmateConflict: null, lastFamilyConflict: null };
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
          log: [...c.log, { age: c.age, month: c.month, text: `Bought ${item.name} for $${item.price.toLocaleString()}.` }],
        },
      };
    });
  }, []);

  // ===== Family interactions =====

  const interactWithRelative = useCallback((relativeId: string, action: 'talk' | 'spendTime' | 'giveMoney' | 'play') => {
    setState((prev) => {
      if (!prev.character) return prev;
      const c = prev.character;
      const relative = c.relatives.find((r) => r.id === relativeId);
      if (!relative || !relative.alive) return prev;

      const isParent = relative.role === 'mother' || relative.role === 'father';
      const isYoungSibling = relative.role === 'sibling' && relative.age < FAMILY_YOUNG_AGE_CUTOFF;

      // Parents can't be interacted with until the character is old enough;
      // young siblings only get "play"; nobody else gets "play".
      if (isParent && c.age < FAMILY_YOUNG_AGE_CUTOFF) return prev;
      if (action === 'play' && !isYoungSibling) return prev;
      if (action !== 'play' && isYoungSibling) return prev;

      if (action === 'talk' && relative.talkedThisMonth) return prev;
      if (action === 'spendTime' && relative.spentTimeThisMonth) return prev;
      if (action === 'giveMoney' && relative.gaveMoneyThisMonth) return prev;
      if (action === 'play' && relative.playedThisMonth) return prev;

      let moneyAmount = 0;
      if (action === 'giveMoney') {
        moneyAmount = Math.min(100, c.money);
        if (moneyAmount <= 0) return prev;
      }

      const flag =
        action === 'talk' ? 'talkedThisMonth'
        : action === 'spendTime' ? 'spentTimeThisMonth'
        : action === 'giveMoney' ? 'gaveMoneyThisMonth'
        : 'playedThisMonth';
      const result = rollFamilyInteraction(action, relative, moneyAmount);

      // A happy parent is more receptive; an upset one, less so.
      let relationshipDelta = result.relationshipDelta;
      if (isParent && c.school) {
        relationshipDelta = Math.round(relationshipDelta * parentSatisfactionRelationshipMultiplier(c.school.parentSatisfaction));
      }

      const relatives = c.relatives.map((r) =>
        r.id === relativeId ? { ...r, [flag]: true, relationship: clamp(r.relationship + relationshipDelta) } : r
      );

      return {
        ...prev,
        character: {
          ...c,
          relatives,
          money: c.money + result.moneyDelta,
          stats: { ...c.stats, happiness: clamp(c.stats.happiness + result.happinessDelta) },
          log: [...c.log, { age: c.age, month: c.month, text: result.logText, kind: 'self' }],
        },
        lastFamilyConflict: result.conflictReason ? { relativeId, reason: result.conflictReason } : null,
        lastClassmateConflict: null,
      };
    });
  }, []);

  // ===== School: classmate interactions =====

  const interactWithClassmate = useCallback((classmateId: string, action: 'play' | 'shareToy' | 'talk') => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      const school = c.school!;
      const classmate = school.classmates.find((cm) => cm.id === classmateId);
      if (!classmate) return prev;
      if (action === 'play' && classmate.playedThisMonth) return prev;
      if (action === 'shareToy' && classmate.sharedToyThisMonth) return prev;
      if (action === 'talk' && classmate.talkedThisMonth) return prev;

      const flag =
        action === 'play' ? 'playedThisMonth' : action === 'shareToy' ? 'sharedToyThisMonth' : 'talkedThisMonth';
      const result = rollClassmateInteraction(action, classmate.name, c.stats.looks);

      const classmates = school.classmates.map((cm) =>
        cm.id === classmateId
          ? { ...cm, [flag]: true, relationship: clamp(cm.relationship + result.relationshipDelta) }
          : cm
      );

      return {
        ...prev,
        character: {
          ...c,
          school: { ...school, classmates, socialProgress: clamp(school.socialProgress + result.socialDelta) },
          stats: { ...c.stats, happiness: clamp(c.stats.happiness + result.happinessDelta) },
          log: [...c.log, { age: c.age, month: c.month, text: result.logText, kind: 'self' }],
        },
        lastClassmateConflict: result.conflictReason ? { classmateId, reason: result.conflictReason } : null,
        lastFamilyConflict: null,
      };
    });
  }, []);

  // Studying a subject is usable once per subject, per month.
  const interactWithSubject = useCallback((subject: SchoolSubject) => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      const school = c.school!;
      if (school.subjectsStudiedThisMonth[subject]) return prev;

      return {
        ...prev,
        character: {
          ...c,
          school: {
            ...school,
            subjects: { ...school.subjects, [subject]: clamp(school.subjects[subject] + 8) },
            subjectsStudiedThisMonth: { ...school.subjectsStudiedThisMonth, [subject]: true },
          },
          stats: { ...c.stats, smarts: clamp(c.stats.smarts + 1) },
          log: [...c.log, { age: c.age, month: c.month, text: `Studied ${subject} at school.`, kind: 'self' }],
        },
      };
    });
  }, []);

  // "School Actions" are usable once per action, per month.
  const performSchoolAction = useCallback((actionId: string) => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      if (c.school!.actionsUsedThisMonth.includes(actionId)) return prev;
      const action = SCHOOL_ACTIONS.find((a) => a.id === actionId);
      if (!action) return prev;

      const updated = applyEffects(c, schoolActionToEffects(action));
      return {
        ...prev,
        character: {
          ...updated,
          school: updated.school ? { ...updated.school, actionsUsedThisMonth: [...updated.school.actionsUsedThisMonth, actionId] } : updated.school,
        },
      };
    });
  }, []);

  // Permanently withdraws the character from school, by their own choice.
  const quitSchool = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      return { ...prev, character: dropOutOfSchool(prev.character) };
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
          log: [...c.log, { age: c.age, month: c.month, text: `${c.name} was ended by admin override at age ${c.age}.`, kind: 'major' }],
        },
      };
    });
  }, []);

  return {
    character: state.character,
    pendingEvent: state.pendingEvent,
    lastResult: state.lastResult,
    lastClassmateConflict: state.lastClassmateConflict,
    lastFamilyConflict: state.lastFamilyConflict,
    livesLived,
    startNewLife,
    deleteCharacter,
    ageUp,
    nextMonth,
    chooseOption,
    interactWithRelative,
    interactWithClassmate,
    interactWithSubject,
    performSchoolAction,
    quitSchool,
    resolveLicenseTest,
    buyItem,
    setStat,
    setMoney,
    setJob,
    endCharacter,
  };
}
