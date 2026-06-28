import { CHANGELOG } from '../game/changelog';

export function ChangelogPanel() {
  return (
    <div className="changelog-panel">
      {CHANGELOG.map((entry) => (
        <div key={entry.version} className="changelog-entry">
          <h3 className="changelog-version">Version {entry.version}</h3>
          {entry.sections.map((section) => (
            <div key={section.heading} className="changelog-section">
              <div className="changelog-heading">{section.heading}</div>
              <ul className="changelog-list">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
