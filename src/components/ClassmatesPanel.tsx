import type { School } from '../game/types';
import { classmateStatusLabel, BEST_FRIEND_THRESHOLD } from '../game/school';
import { ARCHETYPE_INFO } from '../game/classmateArchetypes';

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

  const outOfFocus = school.focusPoints <= 0;

  return (
    <div className="classmates-section">
      {outOfFocus && <p className="death-note">No focus left this month — come back next month.</p>}
      {school.classmates.map((cm) => {
        const isBestFriend = cm.relationship >= BEST_FRIEND_THRESHOLD;
        return (
          <div key={cm.id} className="classmate-card">
            <div className="relative-head">
              <span className="relative-name">{cm.name}</span>
              <span className={`relative-meta ${isBestFriend ? 'status-gold' : ''}`}>
                {classmateStatusLabel(cm.relationship)}
              </span>
            </div>
            <p className="classmate-archetype-note">
              <strong>{ARCHETYPE_INFO[cm.archetype].label}</strong> — {ARCHETYPE_INFO[cm.archetype].description}
            </p>
            <div className="stat-track">
              <div
                className="stat-fill"
                style={{ width: `${cm.relationship}%`, background: isBestFriend ? 'var(--gold)' : 'var(--relationship)' }}
              />
            </div>
            <div className="relative-actions">
              <button
                className="secondary-btn"
                disabled={cm.playedThisMonth || outOfFocus}
                onClick={() => onInteract(cm.id, 'play')}
              >
                {cm.playedThisMonth ? 'Played ✓' : 'Play'}
              </button>
              <button
                className="secondary-btn"
                disabled={cm.sharedToyThisMonth || outOfFocus}
                onClick={() => onInteract(cm.id, 'shareToy')}
              >
                {cm.sharedToyThisMonth ? 'Shared ✓' : 'Share Toy'}
              </button>
              <button
                className="secondary-btn"
                disabled={cm.talkedThisMonth || outOfFocus}
                onClick={() => onInteract(cm.id, 'talk')}
              >
                {cm.talkedThisMonth ? 'Talked ✓' : 'Talk'}
              </button>
            </div>
            {conflict?.classmateId === cm.id && <p className="conflict-reason">{conflict.reason}</p>}
          </div>
        );
      })}
    </div>
  );
}
