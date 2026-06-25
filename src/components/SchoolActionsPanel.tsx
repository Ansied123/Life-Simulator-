import { useState } from 'react';
import type { School } from '../game/types';
import { SCHOOL_ACTIONS, describeSchoolAction } from '../game/schoolActions';

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

  return (
    <div className="school-actions-panel">
      <div className="school-actions-list">
        {SCHOOL_ACTIONS.map((action) => {
          const used = school.actionsUsedThisMonth.includes(action.id);
          return (
            <div key={action.id} className="school-action-item">
              <div className="school-action-info">
                <span className="school-action-name">{action.name}</span>
                <span className="school-action-meta">{describeSchoolAction(action)}</span>
              </div>
              <button
                className="secondary-btn school-action-btn"
                disabled={used}
                onClick={() => onPerform(action.id)}
              >
                {used ? 'Done ✓' : 'Do It'}
              </button>
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
