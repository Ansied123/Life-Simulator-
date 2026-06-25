import type { School } from '../game/types';
import { classmateStatusLabel } from '../game/school';

type ClassmateAction = 'play' | 'shareToy' | 'talk';

export function ClassmatesPanel({
  school,
  onInteract,
  conflict,
}: {
  school: School | null;
  onInteract: (classmateId: string, action: ClassmateAction) => void;
  conflict: { classmateId: string; reason: string } | null;
}) {
  if (!school) {
    return <p className="death-note">Not enrolled in school yet.</p>;
  }

  return (
    <div className="classmates-section">
      {school.classmates.map((cm) => (
        <div key={cm.id} className="classmate-card">
          <div className="relative-head">
            <span className="relative-name">{cm.name}</span>
            <span className="relative-meta">{classmateStatusLabel(cm.relationship)}</span>
          </div>
          <div className="stat-track">
            <div className="stat-fill" style={{ width: `${cm.relationship}%`, background: 'var(--relationship)' }} />
          </div>
          <div className="relative-actions">
            <button
              className="secondary-btn"
              disabled={cm.playedThisMonth}
              onClick={() => onInteract(cm.id, 'play')}
            >
              {cm.playedThisMonth ? 'Played ✓' : 'Play'}
            </button>
            <button
              className="secondary-btn"
              disabled={cm.sharedToyThisMonth}
              onClick={() => onInteract(cm.id, 'shareToy')}
            >
              {cm.sharedToyThisMonth ? 'Shared ✓' : 'Share Toy'}
            </button>
            <button
              className="secondary-btn"
              disabled={cm.talkedThisMonth}
              onClick={() => onInteract(cm.id, 'talk')}
            >
              {cm.talkedThisMonth ? 'Talked ✓' : 'Talk'}
            </button>
          </div>
          {conflict?.classmateId === cm.id && <p className="conflict-reason">{conflict.reason}</p>}
        </div>
      ))}
    </div>
  );
}
