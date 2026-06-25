import type { School, SchoolSubject } from '../game/types';
import { SCHOOL_SUBJECTS } from '../game/types';
import { learningLabel } from '../game/school';

export function StudyPanel({
  school,
  onStudy,
}: {
  school: School;
  onStudy: (subject: SchoolSubject) => void;
}) {
  return (
    <div className="study-list">
      {SCHOOL_SUBJECTS.map((subject) => {
        const studied = school.subjectsStudiedThisMonth[subject];
        return (
          <div key={subject} className="study-item">
            <div className="study-info">
              <span className="study-name">{subject}</span>
              <span className="study-meta">{learningLabel(school.subjects[subject])}</span>
            </div>
            <button className="secondary-btn study-btn" disabled={studied} onClick={() => onStudy(subject)}>
              {studied ? 'Studied ✓' : 'Study'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
