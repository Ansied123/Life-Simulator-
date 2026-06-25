import type { Character } from '../game/types';
import { MONTHLY_MODE_MIN_AGE, currentMonthName, monthsUntilNewAge } from '../game/calendar';

export function CharacterHeader({
  character,
  onViewDetails,
}: {
  character: Character;
  onViewDetails: () => void;
}) {
  const monthlyMode = character.age >= MONTHLY_MODE_MIN_AGE;
  const remaining = monthsUntilNewAge(character.month);

  return (
    <div className="char-header">
      <div className="char-year">
        Year {character.birthYear + character.age}
        {monthlyMode && (
          <>
            {' '}· {currentMonthName(character.birthMonth, character.month)} · {remaining}{' '}
            {remaining === 1 ? 'month' : 'months'} until age {character.age + 1}
          </>
        )}
      </div>
      <div className="char-id">
        <div className="char-name">{character.name}</div>
        <div className="char-id-meta-row">
          <button className="link-btn char-details-btn" onClick={onViewDetails}>
            View Details
          </button>
          <span className="char-meta">
            {character.gender === 'male' ? '♂' : '♀'} · Age {character.age}
          </span>
        </div>
      </div>
      <div className="char-figures">
        <div className="figure">
          <span className="figure-label">Balance</span>
          <span className="figure-value">
            ${character.money.toLocaleString()}
          </span>
        </div>
        <div className="figure">
          <span className="figure-label">Occupation</span>
          <span className="figure-value">{character.job ?? 'None'}</span>
        </div>
      </div>
    </div>
  );
}
