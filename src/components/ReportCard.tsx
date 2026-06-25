import type { Character } from '../game/types';
import { SCHOOL_SUBJECTS } from '../game/types';
import { learningLabel } from '../game/school';

export function ReportCard({ character }: { character: Character }) {
  const school = character.school;
  if (!school) return null;

  return (
    <div className="certificate">
      <div className="certificate-stamp">REPORT CARD</div>
      <h3 className="certificate-title">{school.name}</h3>
      <p className="certificate-subtitle">
        {character.name} · Grade {school.grade} · {school.teacher.name}
      </p>

      {SCHOOL_SUBJECTS.map((subject) => (
        <div key={subject} className="certificate-row">
          <span className="certificate-label">{subject}</span>
          <span className="certificate-value">{learningLabel(school.subjects[subject])}</span>
        </div>
      ))}
    </div>
  );
}
