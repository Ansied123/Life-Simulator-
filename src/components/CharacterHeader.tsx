import type { Character } from '../game/types';

export function CharacterHeader({ character }: { character: Character }) {
  return (
    <div className="char-header">
      <div className="char-id">
        <span className="char-name">{character.name}</span>
        <span className="char-meta">
          {character.gender === 'male' ? '♂' : '♀'} · Age {character.age}
        </span>
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
