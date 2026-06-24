import type { StatKey } from '../game/types';

const STAT_META: Record<StatKey, { label: string; color: string }> = {
  health: { label: 'Health', color: 'var(--stat-health)' },
  happiness: { label: 'Happiness', color: 'var(--stat-happiness)' },
  smarts: { label: 'Smarts', color: 'var(--stat-smarts)' },
  looks: { label: 'Looks', color: 'var(--stat-looks)' },
};

export function StatBar({ stat, value }: { stat: StatKey; value: number }) {
  const meta = STAT_META[stat];
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">{meta.label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-track">
        <div
          className="stat-fill"
          style={{ width: `${value}%`, background: meta.color }}
        />
      </div>
    </div>
  );
}
