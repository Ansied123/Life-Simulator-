import type { Relative, RelativeRole } from '../game/types';

const ROLE_LABEL: Record<RelativeRole, string> = {
  mother: 'Mother',
  father: 'Father',
  sibling: 'Sibling',
};

type Action = 'talk' | 'spendTime' | 'giveMoney';

export function FamilyPanel({
  relatives,
  money,
  onInteract,
}: {
  relatives: Relative[];
  money: number;
  onInteract: (relativeId: string, action: Action) => void;
}) {
  if (relatives.length === 0) {
    return <p className="death-note">No family on record.</p>;
  }

  return (
    <div className="family-panel">
      {relatives.map((r) => (
        <div key={r.id} className={`relative-card ${r.alive ? '' : 'deceased'}`}>
          <div className="relative-head">
            <span className="relative-name">{r.name}</span>
            <span className="relative-meta">
              {ROLE_LABEL[r.role]} · {r.alive ? `Age ${r.age}` : `Died at ${r.age}`}
            </span>
          </div>

          {r.alive ? (
            <>
              <div className="stat-head">
                <span className="stat-label">Relationship</span>
                <span className="stat-value">{r.relationship}</span>
              </div>
              <div className="stat-track">
                <div className="stat-fill" style={{ width: `${r.relationship}%`, background: 'var(--relationship)' }} />
              </div>
              <div className="relative-actions">
                <button
                  className="secondary-btn"
                  disabled={r.talkedThisYear}
                  onClick={() => onInteract(r.id, 'talk')}
                >
                  {r.talkedThisYear ? 'Talked ✓' : 'Talk'}
                </button>
                <button
                  className="secondary-btn"
                  disabled={r.spentTimeThisYear}
                  onClick={() => onInteract(r.id, 'spendTime')}
                >
                  {r.spentTimeThisYear ? 'Spent Time ✓' : 'Spend Time'}
                </button>
                <button
                  className="secondary-btn"
                  disabled={r.gaveMoneyThisYear || money <= 0}
                  onClick={() => onInteract(r.id, 'giveMoney')}
                >
                  {r.gaveMoneyThisYear ? 'Gave Money ✓' : 'Give Money'}
                </button>
              </div>
            </>
          ) : (
            <p className="relative-memory">In loving memory.</p>
          )}
        </div>
      ))}
    </div>
  );
}
