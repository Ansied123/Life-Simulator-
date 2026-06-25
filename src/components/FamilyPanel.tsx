import type { Relative, RelativeRole } from '../game/types';
import { FAMILY_YOUNG_AGE_CUTOFF } from '../game/family';

const ROLE_LABEL: Record<RelativeRole, string> = {
  mother: 'Mother',
  father: 'Father',
  sibling: 'Sibling',
};

type Action = 'talk' | 'spendTime' | 'giveMoney' | 'play';

export function FamilyPanel({
  relatives,
  money,
  characterAge,
  onInteract,
  conflict,
}: {
  relatives: Relative[];
  money: number;
  characterAge: number;
  onInteract: (relativeId: string, action: Action) => void;
  conflict: { relativeId: string; reason: string } | null;
}) {
  if (relatives.length === 0) {
    return <p className="death-note">No family on record.</p>;
  }

  return (
    <div className="family-panel">
      {relatives.map((r) => {
        const isParent = r.role === 'mother' || r.role === 'father';
        const isYoungSibling = r.role === 'sibling' && r.age < FAMILY_YOUNG_AGE_CUTOFF;
        const parentsLocked = isParent && characterAge < FAMILY_YOUNG_AGE_CUTOFF;

        return (
          <div key={r.id} className={`relative-card ${r.alive ? '' : 'deceased'}`}>
            <div className="relative-head">
              <span className="relative-name">{r.name}</span>
              <span className="relative-meta">
                {ROLE_LABEL[r.role]} · {r.alive ? `Age ${r.age}` : `Died at ${r.age}`}
              </span>
            </div>

            {r.alive ? (
              <>
                {r.job !== undefined && <p className="relative-job">{r.job ?? 'Not employed'}</p>}
                <div className="stat-head">
                  <span className="stat-label">Relationship</span>
                  <span className="stat-value">{r.relationship}</span>
                </div>
                <div className="stat-track">
                  <div className="stat-fill" style={{ width: `${r.relationship}%`, background: 'var(--relationship)' }} />
                </div>

                {parentsLocked ? (
                  <p className="relative-locked-note">Too young to interact directly — the bond changes on its own for now.</p>
                ) : isYoungSibling ? (
                  <div className="relative-actions">
                    <button
                      className="secondary-btn"
                      disabled={r.playedThisMonth}
                      onClick={() => onInteract(r.id, 'play')}
                    >
                      {r.playedThisMonth ? 'Played ✓' : 'Play'}
                    </button>
                  </div>
                ) : (
                  <div className="relative-actions">
                    <button
                      className="secondary-btn"
                      disabled={r.talkedThisMonth}
                      onClick={() => onInteract(r.id, 'talk')}
                    >
                      {r.talkedThisMonth ? 'Talked ✓' : 'Talk'}
                    </button>
                    <button
                      className="secondary-btn"
                      disabled={r.spentTimeThisMonth}
                      onClick={() => onInteract(r.id, 'spendTime')}
                    >
                      {r.spentTimeThisMonth ? 'Spent Time ✓' : 'Spend Time'}
                    </button>
                    <button
                      className="secondary-btn"
                      disabled={r.gaveMoneyThisMonth || money <= 0}
                      onClick={() => onInteract(r.id, 'giveMoney')}
                    >
                      {r.gaveMoneyThisMonth ? 'Gave Money ✓' : 'Give Money'}
                    </button>
                  </div>
                )}
                {conflict?.relativeId === r.id && <p className="conflict-reason">{conflict.reason}</p>}
              </>
            ) : (
              <p className="relative-memory">In loving memory.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
