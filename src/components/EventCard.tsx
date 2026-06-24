import type { Character, GameEvent, Choice } from '../game/types';

export function EventCard({
  event,
  character,
  onChoose,
}: {
  event: GameEvent;
  character: Character;
  onChoose: (choice: Choice) => void;
}) {
  return (
    <div className="event-card">
      <div className="event-stamp">EVENT</div>
      <p className="event-text">{event.text(character)}</p>
      <div className="choices">
        {event.choices.map((choice, i) => (
          <button key={i} className="choice-btn" onClick={() => onChoose(choice)}>
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
