import { useState } from 'react';
import type { School } from '../game/types';
import { SCHOOL_ACTIONS } from '../game/schoolActions';

export function SchoolActionsPanel({
  school,
  onPerform,
  onDropOut,
}: {
  school: School;
  onPerform: (actionId: string) => void;
  onDropOut: () => void;
}) {
  const [confirmingDropOut, setConfirmingDropOut] = useState(false);
  const outOfFocus = school.focusPoints <= 0;

  return (
    <div className="school-actions-panel">
      {outOfFocus && <p className="death-note">No focus left this month — come back next month.</p>}
      <div className="school-actions-list">
        {SCHOOL_ACTIONS.map((action) => {
          const used = school.actionsUsedThisMonth.includes(action.id);
          const disabled = used || outOfFocus;
          return (
            <div
              key={action.id}
              className={`school-action-item ${disabled ? 'school-action-item-used' : ''}`}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              onClick={() => {
                if (disabled) return;
                onPerform(action.id);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') onPerform(action.id);
              }}
            >
              <span className="school-action-name">{action.name}</span>
              {used && <span className="school-action-status">Done ✓</span>}
            </div>
          );
        })}
      </div>

      <div className="dropout-section">
        {confirmingDropOut ? (
          <>
            <p className="death-note">This will permanently withdraw you from kindergarten. Are you sure?</p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setConfirmingDropOut(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={onDropOut}>
                Drop Out
              </button>
            </div>
          </>
        ) : (
          <button className="corner-btn corner-btn-danger dropout-btn" onClick={() => setConfirmingDropOut(true)}>
            Drop Out of School
          </button>
        )}
      </div>
    </div>
  );
}
