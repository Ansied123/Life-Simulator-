import type { Character } from '../game/types';
import { formatDate } from '../game/calendar';

export function BirthCertificate({ character }: { character: Character }) {
  const mother = character.relatives.find((r) => r.role === 'mother');
  const father = character.relatives.find((r) => r.role === 'father');

  return (
    <div className="certificate">
      <div className="certificate-stamp">OFFICIAL</div>
      <h3 className="certificate-title">Certificate of Live Birth</h3>
      <p className="certificate-subtitle">United States of America</p>

      <div className="certificate-row">
        <span className="certificate-label">Full Name</span>
        <span className="certificate-value">{character.name}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Sex</span>
        <span className="certificate-value">{character.gender === 'male' ? 'Male' : 'Female'}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Date of Birth</span>
        <span className="certificate-value">
          {formatDate(character.birthYear, character.birthMonth, character.birthDay)}
        </span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Residence</span>
        <span className="certificate-value">{character.address}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Mother</span>
        <span className="certificate-value">{mother?.name ?? 'Unknown'}</span>
      </div>
      <div className="certificate-row">
        <span className="certificate-label">Father</span>
        <span className="certificate-value">{father?.name ?? 'Unknown'}</span>
      </div>
    </div>
  );
}
