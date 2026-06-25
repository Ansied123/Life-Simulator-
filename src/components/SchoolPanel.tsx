import { useState } from 'react';
import type { Character } from '../game/types';
import { currentMonthName, calendarYearAt } from '../game/calendar';
import {
  behaviorLabel,
  learningLabel,
  socialLabel,
  teacherRelationshipLabel,
  overallLearningProgress,
} from '../game/school';

export function SchoolPanel({
  character,
  onOpenReportCard,
  onOpenStudy,
  onOpenSchoolActions,
  onOpenParentInvolvement,
}: {
  character: Character;
  onOpenReportCard: () => void;
  onOpenStudy: () => void;
  onOpenSchoolActions: () => void;
  onOpenParentInvolvement: () => void;
}) {
  const [detailsFolded, setDetailsFolded] = useState(false);
  const school = character.school;
  if (!school) {
    return <p className="death-note">Not enrolled in school yet.</p>;
  }

  // The school year is the calendar year of enrollment (September), not
  // necessarily the character's current age-derived year.
  const yearNow = calendarYearAt(character.birthYear, character.birthMonth, school.enrolledAge, school.enrolledMonth);
  const learning = overallLearningProgress(school);

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

      <div className="student-info-card">
        <div className="student-info-header">Student Info</div>

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
      </div>
    </div>
  );
}
