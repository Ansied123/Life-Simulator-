import { useState } from 'react';
import type { Character } from '../game/types';
import { currentMonthName, calendarYearAt } from '../game/calendar';
import {
  behaviorLabel,
  learningLabel,
  socialLabel,
  teacherRelationshipLabel,
  overallLearningProgress,
  MAX_FOCUS_POINTS,
  SCHOOL_GOALS,
} from '../game/school';
import { TEMPERAMENT_INFO, SCHOOL_CULTURE_INFO } from '../game/schoolTraits';
import { computeReputationTags, REPUTATION_TAG_INFO } from '../game/reputationTags';

export function SchoolPanel({
  character,
  onOpenReportCard,
  onOpenStudy,
  onOpenSchoolActions,
  onOpenParentInvolvement,
  onRest,
}: {
  character: Character;
  onOpenReportCard: () => void;
  onOpenStudy: () => void;
  onOpenSchoolActions: () => void;
  onOpenParentInvolvement: () => void;
  onRest: () => void;
}) {
  const [detailsFolded, setDetailsFolded] = useState(true);
  const school = character.school;
  if (!school) {
    return <p className="death-note">Not enrolled in school yet.</p>;
  }

  // The school year is the calendar year of enrollment (September), not
  // necessarily the character's current age-derived year.
  const yearNow = calendarYearAt(character.birthYear, character.birthMonth, school.enrolledAge, school.enrolledMonth);
  const learning = overallLearningProgress(school);
  const reputationTags = computeReputationTags(school);

  return (
    <div className="school-panel">
      <div className="school-info-card">
        <div className="school-info-header">
          <span className="school-info-title">School Details</span>
          <button
            className="fold-toggle-btn"
            onClick={() => setDetailsFolded((f) => !f)}
            aria-expanded={!detailsFolded}
          >
            {detailsFolded ? '▼ Show' : '▲ Hide'}
          </button>
        </div>

        {!detailsFolded && (
          <>
            <div className="school-info-row">
              <span className="school-info-label">School</span>
              <span className="school-info-value">{school.name}</span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">Level</span>
              <span className="school-info-value">
                {school.level} · Grade {school.grade}
              </span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">School Year</span>
              <span className="school-info-value">
                {yearNow}-{yearNow + 1} · {currentMonthName(character.birthMonth, character.month)}
              </span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">Teacher</span>
              <span className="school-info-value">{school.teacher.name}</span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">Classroom</span>
              <span className="school-info-value">{school.classroom}</span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">District</span>
              <span className="school-info-value">{school.district}</span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">School Type</span>
              <span className="school-info-value">{school.type}</span>
            </div>
            <div className="school-info-row">
              <span className="school-info-label">School Culture</span>
              <span className="school-info-value">{school.culture}</span>
            </div>
            <p className="school-culture-note">{SCHOOL_CULTURE_INFO[school.culture].tagline}</p>
          </>
        )}

        <div className="school-info-actions">
          <button className="secondary-btn" onClick={onOpenReportCard}>
            Grade Details
          </button>
          <button className="secondary-btn" onClick={onOpenStudy}>
            Study
          </button>
          <button className="secondary-btn" onClick={onOpenSchoolActions}>
            School Actions
          </button>
          <button className="secondary-btn" onClick={onOpenParentInvolvement}>
            Parent Involvement
          </button>
        </div>
      </div>

      <div className="focus-card">
        <div className="focus-header">
          <span className="focus-label">Monthly Focus</span>
          <span className="focus-value">
            {school.focusPoints} / {MAX_FOCUS_POINTS}
          </span>
        </div>
        <p className="focus-note">You only have so much energy as a kindergartener. Choose what matters this month.</p>
        <button className="secondary-btn rest-btn" disabled={school.focusPoints <= 0} onClick={onRest}>
          Rest at Home (+2 Health, +1 Happiness · 1 Focus)
        </button>
      </div>

      <div className="goals-card">
        <div className="goals-header">Goals This Year</div>
        <ul className="goals-list">
          {school.goalIds.map((id) => {
            const goal = SCHOOL_GOALS.find((g) => g.id === id);
            if (!goal) return null;
            const complete = goal.isComplete(school);
            return (
              <li key={id} className={`goal-item ${complete ? 'goal-complete' : ''}`}>
                <span className="goal-check">{complete ? '✓' : '○'}</span>
                <span className="goal-text">
                  <strong>{goal.label}</strong> — {goal.description}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="student-info-card">
        <div className="student-info-header">Student Info</div>

        {character.temperament && (
          <p className="temperament-note">
            <strong>{TEMPERAMENT_INFO[character.temperament].label}</strong> —{' '}
            {TEMPERAMENT_INFO[character.temperament].description}
          </p>
        )}

        <div className="student-stat-row">
          <span className="stat-label">Attendance</span>
          <span className="stat-value">{school.attendance}%</span>
        </div>
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${school.attendance}%`, background: 'var(--stat-health)' }} />
        </div>

        <div className="student-stat-row">
          <span className="stat-label">Behavior</span>
          <span className="stat-value">{behaviorLabel(school.behavior)}</span>
        </div>
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${school.behavior}%`, background: 'var(--stat-happiness)' }} />
        </div>

        <div className="student-stat-row">
          <span className="stat-label">Learning Progress</span>
          <span className="stat-value">{learningLabel(learning)}</span>
        </div>
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${learning}%`, background: 'var(--stat-smarts)' }} />
        </div>

        <div className="student-stat-row">
          <span className="stat-label">Social Progress</span>
          <span className="stat-value">{socialLabel(school.socialProgress)}</span>
        </div>
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${school.socialProgress}%`, background: 'var(--relationship)' }} />
        </div>

        <div className="student-stat-row">
          <span className="stat-label">Teacher Relationship</span>
          <span className="stat-value">{teacherRelationshipLabel(school.teacherRelationship)}</span>
        </div>
        <div className="stat-track">
          <div className="stat-fill" style={{ width: `${school.teacherRelationship}%`, background: 'var(--stat-looks)' }} />
        </div>

        {reputationTags.length > 0 && (
          <div className="reputation-tags">
            {reputationTags.map((tag) => (
              <span key={tag} className="reputation-tag-chip" title={REPUTATION_TAG_INFO[tag].description}>
                {REPUTATION_TAG_INFO[tag].label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
