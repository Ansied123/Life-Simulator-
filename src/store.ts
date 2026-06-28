import { useState, useEffect, useCallback } from 'react';
import type { Character, GameEvent, Choice, StatKey, Item, SchoolSubject } from './game/types';
import { SCHOOL_SUBJECTS } from './game/types';
import type { CharacterCreationInput } from './game/character';
import { createCharacter, applyEffects, clamp } from './game/character';
import { naturalAging, rollDeath, ageRelatives } from './game/engine';
import { rollAdditionalSiblings, rollFamilyInteraction, tickFamilyMonthly, FAMILY_YOUNG_AGE_CUTOFF } from './game/family';
import {
  maybeEnrollInSchool,
  resetMonthlySchoolFlags,
  maybeWithdrawFromKindergarten,
  dropOutOfSchool,
  checkSchoolAwards,
  checkKindergartenMemories,
  maybeEndKindergarten,
  moveOnDespiteRecommendation,
  repeatKindergartenYear,
  switchSchoolAndRepeat,
  rollClassmateInteraction,
  updateParentInvolvement,
  parentSatisfactionRelationshipMultiplier,
  parentHelpLevelLabel,
  applyCulturePressure,
  applyLowHealthAttendanceDip,
  maybeRevealTeacherHint,
  BEST_FRIEND_THRESHOLD,
} from './game/school';
import { adjustSubjectDelta, temperamentStudyBonus, cultureStudyDelta, adjustHappinessDelta } from './game/schoolTraits';
import { archetypeBehaviorRiskChance, archetypeBestFriendSmartsChance } from './game/classmateArchetypes';
import { tagPlaySocialBonus, tagClassmateSocialPenalty, tagConflictSocialPenaltyMultiplier } from './game/reputationTags';
import { lowHealthStudyPenalty, lowHappinessStudyPenalty } from './game/balance';
import { SCHOOL_ACTIONS, resolveSchoolAction } from './game/schoolActions';
import { pickEvent } from './game/events';
import { DRIVERS_LICENSE_EVENT } from './game/events/drivers';
import { MOVE_ON_CHOICE_TEXT, REPEAT_CHOICE_TEXT, SWITCH_SCHOOL_CHOICE_TEXT } from './game/events/kindergartenRepeat';
import { MONTHS_PER_YEAR } from './game/calendar';
import type { ShopItem } from './game/shop';
import { saveGame, loadGame, clearSave, getLivesLived, incrementLivesLived } from './game/save';

const LICENSE_OFFER_CHANCE = 0.7;
// Above this, a teacher relationship is good enough to make studying easier.
const HIGH_TEACHER_RELATIONSHIP_STUDY_THRESHOLD = 75;

interface GameState {
  character: Character | null;
  // The event currently awaiting a player choice, if any.
  pendingEvent: GameEvent | null;
  // The most recent classmate interaction that triggered a conflict, if any;
  // cleared by any other state-changing action.
  lastClassmateConflict: { classmateId: string; reason: string } | null;
  // Same idea, for family interactions.
  lastFamilyConflict: { relativeId: string; reason: string } | null;
  // Set the instant kindergarten enrollment happens, so the UI can show a
  // floating alert; persists until the player confirms it.
  schoolEnrollmentAlert: { schoolName: string } | null;
}

// Shared by ageUp (ages 0-4) and nextMonth's year-wrap (age 5+): ages the
// character a full year, ticks relatives, rolls death, and picks an event.
function advanceYear(
  c: Character,
  firedOnce: Set<string>
): { character: Character; pendingEvent: GameEvent | null; schoolEnrollmentAlert: { schoolName: string } | null } {
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
      schoolEnrollmentAlert: null,
    };
  }

  const wasEnrolled = !!updated.school;
  updated = maybeEnrollInSchool(updated);
  const schoolEnrollmentAlert = !wasEnrolled && updated.school ? { schoolName: updated.school.name } : null;

  updated = checkSchoolAwards(updated);
  updated = checkKindergartenMemories(updated);
  updated = updateParentInvolvement(updated);
  updated = applyCulturePressure(updated);
  updated = applyLowHealthAttendanceDip(updated);
  updated = maybeRevealTeacherHint(updated);

  const kindergartenEnd = maybeEndKindergarten(updated);
  updated = kindergartenEnd.character;
  if (kindergartenEnd.pendingEvent) {
    return { character: updated, pendingEvent: kindergartenEnd.pendingEvent, schoolEnrollmentAlert };
  }

  // The driver's license offer is a once-in-a-lifetime, age-16-only check:
  // 70% of the time it's guaranteed to show that year, 30% it never appears.
  if (updated.age === 16 && Math.random() < LICENSE_OFFER_CHANCE) {
    return { character: updated, pendingEvent: DRIVERS_LICENSE_EVENT, schoolEnrollmentAlert };
  }

  return { character: updated, pendingEvent: pickEvent(updated, firedOnce), schoolEnrollmentAlert };
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    character: null,
    pendingEvent: null,
    lastClassmateConflict: null,
    lastFamilyConflict: null,
    schoolEnrollmentAlert: null,
  });
  // Tracks which "once" events have already fired this life.
  const [firedOnce, setFiredOnce] = useState<Set<string>>(new Set());
  const [livesLived, setLivesLived] = useState<number>(getLivesLived);

  // Load any existing save on first mount.
  useEffect(() => {
    const save = loadGame();
    if (save) {
      setState({ character: save.character, pendingEvent: null, lastClassmateConflict: null, lastFamilyConflict: null, schoolEnrollmentAlert: null });
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
    setState({ character: createCharacter(input), pendingEvent: null, lastClassmateConflict: null, lastFamilyConflict: null, schoolEnrollmentAlert: null });
    setLivesLived(incrementLivesLived());
  }, []);

  // Permanently deletes the current character and save data.
  const deleteCharacter = useCallback(() => {
    clearSave();
    setFiredOnce(new Set());
    setState({ character: null, pendingEvent: null, lastClassmateConflict: null, lastFamilyConflict: null, schoolEnrollmentAlert: null });
  }, []);

  // Advance one full year (ages 0-4, before monthly mode kicks in).
  const ageUp = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.alive) return prev;
      const { character, pendingEvent, schoolEnrollmentAlert } = advanceYear(prev.character, firedOnce);
      return { character, pendingEvent, lastClassmateConflict: null, lastFamilyConflict: null, schoolEnrollmentAlert };
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
        const { character, pendingEvent, schoolEnrollmentAlert } = advanceYear(c, firedOnce);
        return { character: resetMonthlySchoolFlags(character), pendingEvent, lastClassmateConflict: null, lastFamilyConflict: null, schoolEnrollmentAlert };
      }
      let updated: Character = { ...c, month: c.month + 1 };
      // Enrollment (September) and graduation (May) are checked every month,
      // since they rarely line up with the character's own birthday.
      const wasEnrolled = !!updated.school;
      updated = maybeEnrollInSchool(updated);
      const schoolEnrollmentAlert = !wasEnrolled && updated.school ? { schoolName: updated.school.name } : null;
      updated = resetMonthlySchoolFlags(updated);
      updated = tickFamilyMonthly(updated);
      updated = checkSchoolAwards(updated);
      updated = checkKindergartenMemories(updated);
      updated = updateParentInvolvement(updated);
      updated = applyCulturePressure(updated);
      updated = applyLowHealthAttendanceDip(updated);
      updated = maybeRevealTeacherHint(updated);

      const kindergartenEnd = maybeEndKindergarten(updated);
      updated = kindergartenEnd.character;
      if (kindergartenEnd.pendingEvent) {
        return {
          character: updated,
          pendingEvent: kindergartenEnd.pendingEvent,
          lastClassmateConflict: null,
          lastFamilyConflict: null,
          schoolEnrollmentAlert,
        };
      }

      updated = maybeWithdrawFromKindergarten(updated);
      const event = pickEvent(updated, firedOnce);
      return { character: updated, pendingEvent: event, lastClassmateConflict: null, lastFamilyConflict: null, schoolEnrollmentAlert };
    });
  }, [firedOnce]);

  // Resolve the player's choice for the pending event. The choice's "result"
  // flavor text rides along as a second line on the same log entry as
  // effects.log — or, on the rare choice with a result but no log line of its
  // own, becomes the log line itself so it's still recorded.
  const chooseOption = useCallback((choice: Choice) => {
    setState((prev) => {
      if (!prev.character || !prev.pendingEvent) return prev;
      const effects = {
        ...choice.effects,
        log: choice.effects.log ?? choice.result,
        detail: choice.effects.log ? choice.result : undefined,
      };
      let updated = applyEffects(prev.character, effects);
      if (prev.pendingEvent.once) {
        setFiredOnce((s) => new Set(s).add(prev.pendingEvent!.id));
      }
      // Feeds the Kindergarten Stage Fright milestone memory.
      if (prev.pendingEvent.id === 'talent_show' && choice.text === 'Get stage fright' && updated.school) {
        updated = { ...updated, school: { ...updated.school, hadStageFright: true } };
      }
      return {
        ...prev,
        character: updated,
        pendingEvent: null,
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

      return { ...prev, character: { ...c, inventory, log }, pendingEvent: null, lastClassmateConflict: null, lastFamilyConflict: null };
    });
  }, []);

  // Resolves the "recommended to repeat kindergarten" decision. Each branch
  // does something a plain Effects object can't (clear school, reset it for
  // a repeat year, or generate a whole new school), so it's handled directly
  // rather than through chooseOption.
  const resolveKindergartenRepeatChoice = useCallback((choiceText: string) => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      let character: Character;
      if (choiceText === MOVE_ON_CHOICE_TEXT) character = moveOnDespiteRecommendation(c);
      else if (choiceText === REPEAT_CHOICE_TEXT) character = repeatKindergartenYear(c);
      else if (choiceText === SWITCH_SCHOOL_CHOICE_TEXT) character = switchSchoolAndRepeat(c);
      else return prev;

      return { ...prev, character, pendingEvent: null, lastClassmateConflict: null, lastFamilyConflict: null };
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
      if (school.focusPoints <= 0) return prev;
      const classmate = school.classmates.find((cm) => cm.id === classmateId);
      if (!classmate) return prev;
      if (action === 'play' && classmate.playedThisMonth) return prev;
      if (action === 'shareToy' && classmate.sharedToyThisMonth) return prev;
      if (action === 'talk' && classmate.talkedThisMonth) return prev;

      const flag =
        action === 'play' ? 'playedThisMonth' : action === 'shareToy' ? 'sharedToyThisMonth' : 'talkedThisMonth';
      const result = rollClassmateInteraction(
        action,
        classmate.name,
        c.stats.looks,
        classmate.relationship,
        c.temperament,
        classmate.archetype,
        c.stats.happiness
      );

      // A Teacher's Helper reputation costs a little social standing; a
      // Playground Leader gets extra credit for organizing play, but takes
      // falling-outs harder.
      let socialDelta = result.socialDelta;
      if (result.conflictReason) {
        socialDelta = Math.round(socialDelta * tagConflictSocialPenaltyMultiplier(school));
      } else {
        socialDelta += tagPlaySocialBonus(school, action);
        if (socialDelta > 0) socialDelta -= tagClassmateSocialPenalty(school);
      }

      // Quiet classmates occasionally reward the moment you actually become
      // best friends; Wild classmates risk a little chaos just by hanging out.
      const newRelationship = clamp(classmate.relationship + result.relationshipDelta);
      const justBecameBestFriend = classmate.relationship < BEST_FRIEND_THRESHOLD && newRelationship >= BEST_FRIEND_THRESHOLD;
      const quietSmartsBonus = justBecameBestFriend && Math.random() < archetypeBestFriendSmartsChance(classmate.archetype) ? 1 : 0;
      const behaviorDelta = Math.random() < archetypeBehaviorRiskChance(classmate.archetype) ? -3 : 0;

      const classmates = school.classmates.map((cm) =>
        cm.id === classmateId ? { ...cm, [flag]: true, relationship: newRelationship } : cm
      );

      // Feeds the Playground Bully Memory: a falling-out with a Bully-status
      // or Tough classmate counts toward "bullied repeatedly."
      const isBullyConflict = !!result.conflictReason && (classmate.relationship < 20 || classmate.archetype === 'Tough');

      return {
        ...prev,
        character: {
          ...c,
          school: {
            ...school,
            classmates,
            socialProgress: clamp(school.socialProgress + socialDelta),
            behavior: clamp(school.behavior + behaviorDelta),
            focusPoints: school.focusPoints - 1,
            bullyConflictCount: school.bullyConflictCount + (isBullyConflict ? 1 : 0),
          },
          stats: {
            ...c.stats,
            happiness: clamp(
              c.stats.happiness + adjustHappinessDelta(result.happinessDelta, c.temperament, school.culture, c.stats.health)
            ),
            smarts: clamp(c.stats.smarts + quietSmartsBonus),
          },
          log: [...c.log, { age: c.age, month: c.month, text: result.logText, kind: 'self' }],
        },
        lastClassmateConflict: result.conflictReason ? { classmateId, reason: result.conflictReason } : null,
        lastFamilyConflict: null,
      };
    });
  }, []);

  // Studying a subject is usable once per subject, per month, and costs 1
  // Focus. The gain isn't a flat +8: it scales down the closer the subject
  // already is to mastered, and shifts a little with how supported (parent
  // help, teacher relationship) or how worn down (happiness, health) the
  // child currently is.
  const interactWithSubject = useCallback((subject: SchoolSubject) => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      const school = c.school!;
      if (school.subjectsStudiedThisMonth[subject] || school.focusPoints <= 0) return prev;

      const scaled = adjustSubjectDelta(subject, 8, c.temperament, school.culture, school.subjects[subject]);
      const helpLabel = parentHelpLevelLabel(school.parentHelpLevel);
      const parentBonus = helpLabel === 'High' ? 2 : helpLabel === 'Medium' ? 1 : 0;
      const teacherBonus = school.teacherRelationship >= HIGH_TEACHER_RELATIONSHIP_STUDY_THRESHOLD ? 1 : 0;
      const gain = Math.max(
        1,
        scaled +
          parentBonus +
          teacherBonus -
          lowHappinessStudyPenalty(c.stats.happiness) -
          lowHealthStudyPenalty(c.stats.health) +
          temperamentStudyBonus(c.temperament) +
          cultureStudyDelta(school.culture)
      );

      return {
        ...prev,
        character: {
          ...c,
          school: {
            ...school,
            subjects: { ...school.subjects, [subject]: clamp(school.subjects[subject] + gain) },
            subjectsStudiedThisMonth: { ...school.subjectsStudiedThisMonth, [subject]: true },
            focusPoints: school.focusPoints - 1,
          },
          stats: { ...c.stats, smarts: clamp(c.stats.smarts + 1) },
          log: [...c.log, { age: c.age, month: c.month, text: `Studied ${subject} at school.`, kind: 'self' }],
        },
      };
    });
  }, []);

  // "School Actions" are usable once per action, per month, and cost 1 Focus
  // (spent whether the action succeeds, fizzles, or backfires).
  const performSchoolAction = useCallback((actionId: string) => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      if (c.school!.actionsUsedThisMonth.includes(actionId) || c.school!.focusPoints <= 0) return prev;
      const action = SCHOOL_ACTIONS.find((a) => a.id === actionId);
      if (!action) return prev;

      const updated = applyEffects(c, resolveSchoolAction(action, c));
      return {
        ...prev,
        character: {
          ...updated,
          school: updated.school
            ? {
                ...updated.school,
                actionsUsedThisMonth: [...updated.school.actionsUsedThisMonth, actionId],
                focusPoints: updated.school.focusPoints - 1,
              }
            : updated.school,
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

  // Spends 1 Focus to have a living parent help with whichever subject is
  // currently weakest; the boost scales with how much the parents can help.
  const askParentForHelp = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      const school = c.school!;
      if (school.focusPoints <= 0) return prev;
      const parents = c.relatives.filter((r) => (r.role === 'mother' || r.role === 'father') && r.alive);
      if (parents.length === 0) return prev;
      const parent = parents[Math.floor(Math.random() * parents.length)];

      const weakest = SCHOOL_SUBJECTS.reduce(
        (min, s) => (school.subjects[s] < school.subjects[min] ? s : min),
        SCHOOL_SUBJECTS[0]
      );
      const helpLabel = parentHelpLevelLabel(school.parentHelpLevel);
      const baseBoost = helpLabel === 'High' ? 8 : helpLabel === 'Medium' ? 6 : 4;
      const scaled = adjustSubjectDelta(weakest, baseBoost, c.temperament, school.culture, school.subjects[weakest]);
      const teacherBonus = school.teacherRelationship >= HIGH_TEACHER_RELATIONSHIP_STUDY_THRESHOLD ? 1 : 0;
      const boost = Math.max(
        1,
        scaled +
          teacherBonus -
          lowHappinessStudyPenalty(c.stats.happiness) -
          lowHealthStudyPenalty(c.stats.health) +
          temperamentStudyBonus(c.temperament) +
          cultureStudyDelta(school.culture)
      );

      return {
        ...prev,
        character: {
          ...c,
          school: {
            ...school,
            subjects: { ...school.subjects, [weakest]: clamp(school.subjects[weakest] + boost) },
            parentSatisfaction: clamp(school.parentSatisfaction + 2),
            focusPoints: school.focusPoints - 1,
          },
          stats: { ...c.stats, smarts: clamp(c.stats.smarts + 1) },
          log: [...c.log, { age: c.age, month: c.month, text: `Practiced ${weakest} with ${parent.name}.`, kind: 'self' }],
        },
      };
    });
  }, []);

  // Spends 1 Focus on recovery instead of school progress.
  const restAtHome = useCallback(() => {
    setState((prev) => {
      if (!prev.character || !prev.character.school) return prev;
      const c = prev.character;
      const school = c.school!;
      if (school.focusPoints <= 0) return prev;
      const happinessGain = adjustHappinessDelta(1, c.temperament, school.culture, c.stats.health);

      return {
        ...prev,
        character: {
          ...c,
          school: { ...school, focusPoints: school.focusPoints - 1 },
          stats: { ...c.stats, health: clamp(c.stats.health + 2), happiness: clamp(c.stats.happiness + happinessGain) },
          log: [...c.log, { age: c.age, month: c.month, text: 'Rested at home instead of pushing yourself at school.', kind: 'self' }],
        },
      };
    });
  }, []);

  // Dismisses the floating kindergarten-enrollment alert.
  const confirmSchoolEnrollmentAlert = useCallback(() => {
    setState((prev) => ({ ...prev, schoolEnrollmentAlert: null }));
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
    lastClassmateConflict: state.lastClassmateConflict,
    lastFamilyConflict: state.lastFamilyConflict,
    schoolEnrollmentAlert: state.schoolEnrollmentAlert,
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
    askParentForHelp,
    restAtHome,
    confirmSchoolEnrollmentAlert,
    resolveLicenseTest,
    resolveKindergartenRepeatChoice,
    buyItem,
    setStat,
    setMoney,
    setJob,
    endCharacter,
  };
}
