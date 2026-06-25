import type { Character } from '../game/types';
import { parentHelpLevelLabel, parentSatisfactionLabel } from '../game/school';

export function ParentInvolvementPanel({ character }: { character: Character }) {
  const school = character.school;
  if (!school) {
    return <p className="death-note">Not enrolled in school yet.</p>;
  }

  const parents = character.relatives.filter((r) => (r.role === 'mother' || r.role === 'father') && r.alive);

  return (
    <div className="parent-involvement-panel">
      <p className="death-note">Since {character.name.split(' ')[0]} is so young, parents matter a lot.</p>

      <div className="student-stat-row">
        <span className="stat-label">Parent Help Level</span>
        <span className="stat-value">{parentHelpLevelLabel(school.parentHelpLevel)}</span>
      </div>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${school.parentHelpLevel}%`, background: 'var(--stat-health)' }} />
      </div>

      <div className="student-stat-row">
        <span className="stat-label">Parent Satisfaction</span>
        <span className="stat-value">{parentSatisfactionLabel(school.parentSatisfaction)}</span>
      </div>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${school.parentSatisfaction}%`, background: 'var(--stat-happiness)' }} />
      </div>

      <div className="student-stat-row">
        <span className="stat-label">Parent-Teacher Meeting</span>
        <span className="stat-value">{school.parentTeacherMeetingStatus}</span>
      </div>

      {parents.length > 0 ? (
        <div className="parent-involvement-list">
          {parents.map((p) => (
            <div key={p.id} className="parent-involvement-row">
              <span className="parent-involvement-name">
                {p.name} ({p.role === 'mother' ? 'Mother' : 'Father'})
              </span>
              <span className="parent-involvement-meta">
                {p.job ?? 'Not employed'} · Relationship {p.relationship}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="death-note">No living parents to help out.</p>
      )}
    </div>
  );
}
