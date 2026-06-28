import type { ProgressReportData } from '../game/types';
import { behaviorLabel, learningLabel, socialLabel } from '../game/school';

export function ProgressReportView({ report }: { report: ProgressReportData }) {
  return (
    <div className="certificate">
      <div className="certificate-stamp">PROGRESS REPORT</div>
      <h3 className="certificate-title">{report.schoolName}</h3>
      <p className="certificate-subtitle">Kindergarten · {report.teacherName}</p>

      <div className="certificate-row">
        <span className="certificate-label">Overall Learning</span>
        <span className="certificate-value">{learningLabel(report.overallLearning)}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Behavior</span>
        <span className="certificate-value">{behaviorLabel(report.behavior)}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Social Progress</span>
        <span className="certificate-value">{socialLabel(report.socialProgress)}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Attendance</span>
        <span className="certificate-value">{report.attendance}%</span>
      </div>
      <div className="certificate-row certificate-row-stacked">
        <span className="certificate-label">Teacher Comment</span>
        <p className="certificate-comment">{report.teacherComment}</p>
      </div>
      <div className="certificate-row certificate-row-stacked">
        <span className="certificate-label">Awards</span>
        {report.awards.length > 0 ? (
          <ul className="certificate-awards-list">
            {report.awards.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <p className="certificate-comment">No awards earned this year.</p>
        )}
      </div>
      <div className="certificate-row certificate-row-stacked">
        <span className="certificate-label">Goals Met</span>
        {report.goalsCompleted.length > 0 ? (
          <ul className="certificate-awards-list">
            {report.goalsCompleted.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        ) : (
          <p className="certificate-comment">No goals met this year.</p>
        )}
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Promotion Status</span>
        <span className="certificate-value">{report.promotionStatus}</span>
      </div>
    </div>
  );
}
