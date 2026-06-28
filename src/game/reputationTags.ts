import type { Classmate, School } from './types';

// Reputation tags are NOT persisted — they're recalculated live from current
// school state every time they're needed, same spirit as ClassmateStatus.
// That keeps them honestly "temporary": improve and a tag drops away on its
// own, same as it appeared.
export type ReputationTag = 'Teachers Helper' | 'Playground Leader' | 'Little Artist' | 'Trouble Magnet';

export const REPUTATION_TAG_INFO: Record<ReputationTag, { label: string; description: string }> = {
  'Teachers Helper': {
    label: "Teacher's Helper",
    description: "Teachers love you — some classmates think you're a bit of a teacher's pet.",
  },
  'Playground Leader': {
    label: 'Playground Leader',
    description: 'Other kids look to you to organize the games — but you take the blowups harder too.',
  },
  'Little Artist': {
    label: 'Little Artist',
    description: 'Known around the classroom for your art and music.',
  },
  'Trouble Magnet': {
    label: 'Trouble Magnet',
    description: 'Always seems to be in the middle of whatever just went wrong.',
  },
};

function friendCount(classmates: Classmate[]): number {
  return classmates.filter((cm) => cm.relationship >= 60).length;
}

export function computeReputationTags(school: School): ReputationTag[] {
  const tags: ReputationTag[] = [];
  if (school.teacherRelationship >= 75 && school.behavior >= 70) tags.push('Teachers Helper');
  if (school.socialProgress >= 75 && friendCount(school.classmates) >= 2) tags.push('Playground Leader');
  if (school.subjects['Art'] >= 70 && school.subjects['Music'] >= 50) tags.push('Little Artist');
  if (school.behavior <= 35) tags.push('Trouble Magnet');
  return tags;
}

function hasTag(school: School, tag: ReputationTag): boolean {
  return computeReputationTags(school).includes(tag);
}

// "Teacher relationship gains +1" for Teacher's Helper.
export function tagTeacherRelationshipBonus(school: School): number {
  return hasTag(school, 'Teachers Helper') ? 1 : 0;
}

// "Classmate social gains -1" for Teacher's Helper (others see a teacher's pet).
export function tagClassmateSocialPenalty(school: School): number {
  return hasTag(school, 'Teachers Helper') ? 1 : 0;
}

// "Play actions give +1 extra social" for Playground Leader.
export function tagPlaySocialBonus(school: School, action: 'play' | 'shareToy' | 'talk'): number {
  return hasTag(school, 'Playground Leader') && action === 'play' ? 1 : 0;
}

// "Conflicts hurt more" for Playground Leader.
export function tagConflictSocialPenaltyMultiplier(school: School): number {
  return hasTag(school, 'Playground Leader') ? 1.5 : 1;
}

// "Creative events appear more often" for Little Artist; "higher chance of
// Caught Misbehaving" for Trouble Magnet.
export function tagEventWeightMultiplier(templateId: string, school: School): number {
  if (hasTag(school, 'Little Artist') && (templateId === 'coloring_contest' || templateId === 'talent_show')) return 1.5;
  if (hasTag(school, 'Trouble Magnet') && templateId === 'caught_misbehaving') return 1.6;
  return 1;
}
