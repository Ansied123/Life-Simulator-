import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { FormEvent } from 'react';
import { useGame } from './store';
import { StatBar } from './components/StatBar';
import { EventCard } from './components/EventCard';
import { CharacterHeader } from './components/CharacterHeader';
import { FamilyPanel } from './components/FamilyPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { ShopPanel } from './components/ShopPanel';
import { BirthCertificate } from './components/BirthCertificate';
import { LicenseQuiz } from './components/LicenseQuiz';
import { SchoolPanel } from './components/SchoolPanel';
import { ReportCard } from './components/ReportCard';
import { ClassmatesPanel } from './components/ClassmatesPanel';
import { StudyPanel } from './components/StudyPanel';
import { SchoolActionsPanel } from './components/SchoolActionsPanel';
import { ParentInvolvementPanel } from './components/ParentInvolvementPanel';
import { ProgressReportView } from './components/ProgressReportView';
import { ChangelogPanel } from './components/ChangelogPanel';
import { Analytics } from '@vercel/analytics/react';
import type { StatKey, Item } from './game/types';
import { randomGender, randomFirstName, randomLastName } from './game/character';
import { DRIVERS_LICENSE_EVENT_ID, TAKE_TEST_CHOICE_TEXT } from './game/events/drivers';
import { KINDERGARTEN_REPEAT_EVENT_ID } from './game/events/kindergartenRepeat';
import { MONTHLY_MODE_MIN_AGE, currentMonthAbbrev } from './game/calendar';
import { initButtonSounds, setSoundMuted, setMusicVolume, playMainMenuMusic, playInGameMusic } from './sound';
import { CHANGELOG } from './game/changelog';
import './App.css';

const STAT_ORDER: StatKey[] = ['health', 'happiness', 'smarts', 'looks'];
const SUFFIX_OPTIONS = ['', 'Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];
const TEXT_SIZES = ['small', 'medium', 'large'] as const;
const APP_VERSION = `v${CHANGELOG[0].version}`;
const SHOP_MIN_AGE = 12;

type Theme = 'light' | 'dark';
type TextSize = (typeof TEXT_SIZES)[number];
const THEME_KEY = 'lifesim_theme';
const TEXT_SIZE_KEY = 'lifesim_text_size';
const MUTED_KEY = 'lifesim_muted';
const MUSIC_VOLUME_KEY = 'lifesim_music_volume';
const DEFAULT_MUSIC_VOLUME = 50;
const ADMIN_PASSWORD = '669988';

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage unavailable; fall back to light.
  }
  return 'light';
}

function getInitialTextSize(): TextSize {
  try {
    const saved = localStorage.getItem(TEXT_SIZE_KEY);
    if (saved === 'small' || saved === 'medium' || saved === 'large') return saved;
  } catch {
    // localStorage unavailable; fall back to medium.
  }
  return 'medium';
}

function getInitialMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === 'true';
  } catch {
    return false;
  }
}

function getInitialMusicVolume(): number {
  try {
    const raw = localStorage.getItem(MUSIC_VOLUME_KEY);
    if (raw !== null) {
      const saved = Number(raw);
      if (Number.isFinite(saved)) return Math.max(0, Math.min(100, saved));
    }
  } catch {
    // localStorage unavailable; fall back to the default.
  }
  return DEFAULT_MUSIC_VOLUME;
}

export default function App() {
  const {
    character,
    pendingEvent,
    lastClassmateConflict,
    lastFamilyConflict,
    schoolEnrollmentAlert,
    livesLived,
    startNewLife,
    deleteCharacter,
    ageUp,
    nextMonth,
    chooseOption,
    interactWithRelative,
    interactWithClassmate,
    interactWithSubject,
    performSchoolAction,
    quitSchool,
    askParentForHelp,
    restAtHome,
    confirmSchoolEnrollmentAlert,
    resolveLicenseTest,
    resolveKindergartenRepeatChoice,
    buyItem,
    setStat,
    setMoney,
    setJob,
    endCharacter,
  } = useGame();
  const [screen, setScreen] = useState<'menu' | 'create' | 'game'>('menu');
  const [view, setView] = useState<'log' | 'family' | 'school' | 'classmates'>('log');
  const [showSettings, setShowSettings] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignInNotice, setShowSignInNotice] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [showBirthCertificate, setShowBirthCertificate] = useState(false);
  const [showLicenseQuiz, setShowLicenseQuiz] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showStudyPanel, setShowStudyPanel] = useState(false);
  const [showSchoolActions, setShowSchoolActions] = useState(false);
  const [showParentInvolvement, setShowParentInvolvement] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [textSize, setTextSize] = useState<TextSize>(getInitialTextSize);
  const [muted, setMuted] = useState<boolean>(getInitialMuted);
  const [musicVolume, setMusicVolumeState] = useState<number>(getInitialMusicVolume);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>(randomGender);
  const [adminStage, setAdminStage] = useState<'closed' | 'login' | 'open'>('closed');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Sync the chosen theme and text size to the document before paint, so the page doesn't flash.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage unavailable; theme just won't persist across sessions.
    }
  }, [theme]);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize);
    try {
      localStorage.setItem(TEXT_SIZE_KEY, textSize);
    } catch {
      // localStorage unavailable; text size just won't persist across sessions.
    }
  }, [textSize]);

  useEffect(() => {
    setSoundMuted(muted);
    try {
      localStorage.setItem(MUTED_KEY, String(muted));
    } catch {
      // localStorage unavailable; mute setting just won't persist across sessions.
    }
  }, [muted]);

  useEffect(() => {
    setMusicVolume(musicVolume);
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
    } catch {
      // localStorage unavailable; music volume just won't persist across sessions.
    }
  }, [musicVolume]);

  // Toggling mute on also silences music, by dragging the volume bar to 0.
  const toggleMuted = () => {
    setMuted((m) => {
      const next = !m;
      if (next) setMusicVolumeState(0);
      return next;
    });
  };

  // Wires a click/switch sound to every button in the app, once.
  useEffect(() => {
    initButtonSounds();
  }, []);

  // The Admin button is hidden from the UI; this secret keybind reopens the
  // admin login instead.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setAdminPassword('');
        setAdminError(false);
        setAdminStage('login');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Background music: the main menu theme plays on the menu/creation
  // screens, swapping to the in-game theme once the player enters a life.
  useEffect(() => {
    if (screen === 'game') {
      playInGameMusic();
    } else {
      playMainMenuMusic();
    }
  }, [screen]);

  // Auto-scroll the life log to the newest entry: on new entries, and also
  // whenever the player switches back to the Life Record tab.
  useEffect(() => {
    if (view === 'log') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [character?.log.length, view]);

  // If school ends (manual drop-out or auto-drop-out), fall back to a tab
  // that still exists instead of leaving School/Classmates selected but gone.
  useEffect(() => {
    if (!character?.school && (view === 'school' || view === 'classmates')) {
      setView('log');
    }
  }, [character?.school, view]);

  const randomizeIdentity = () => {
    const g = randomGender();
    setGender(g);
    setFirstName(randomFirstName(g));
    setLastName(randomLastName());
  };

  const beginLife = () => {
    startNewLife({ firstName, middleName, lastName, suffix, gender });
    setScreen('game');
  };

  const submitAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminStage('open');
      setAdminError(false);
    } else {
      setAdminError(true);
    }
    setAdminPassword('');
  };

  const globalUI = (
    <>
      <div className="top-right-controls">
        <button className="corner-btn" onClick={() => setShowSignInNotice(true)}>
          Sign In
        </button>
      </div>

      <div className="version-tag">{APP_VERSION}</div>

      {schoolEnrollmentAlert && (
        <div className="settings-overlay">
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span>Kindergarten Enrollment</span>
            </div>
            <p className="death-note">
              {character?.name} has been enrolled in kindergarten at {schoolEnrollmentAlert.schoolName}!
            </p>
            <button
              className="primary-btn"
              style={{ width: '100%', marginTop: 12 }}
              onClick={confirmSchoolEnrollmentAlert}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span>Settings</span>
              <button className="close-btn" onClick={() => setShowSettings(false)} aria-label="Close settings">
                ×
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Night Mode</span>
              <button
                className={`toggle-switch ${theme === 'dark' ? 'on' : ''}`}
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              >
                <span className="toggle-knob" />
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Mute Volume</span>
              <button
                className={`toggle-switch ${muted ? 'on' : ''}`}
                role="switch"
                aria-checked={muted}
                onClick={toggleMuted}
              >
                <span className="toggle-knob" />
              </button>
            </div>
            <div className="settings-row settings-row-stacked">
              <span className="settings-label">Music Volume</span>
              <div className="volume-slider-row">
                <input
                  type="range"
                  className="volume-slider"
                  min={0}
                  max={100}
                  value={musicVolume}
                  onChange={(e) => setMusicVolumeState(Number(e.target.value))}
                  aria-label="Music volume"
                />
                <span className="volume-value">{musicVolume}%</span>
              </div>
            </div>
            <div className="settings-row settings-row-stacked">
              <span className="settings-label">Text Size</span>
              <div className="text-size-toggle">
                {TEXT_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`text-size-btn ${textSize === size ? 'selected' : ''}`}
                    onClick={() => setTextSize(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div className="settings-overlay" onClick={() => setShowChangelog(false)}>
          <div className="settings-panel changelog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span>Changelog</span>
              <button className="close-btn" onClick={() => setShowChangelog(false)} aria-label="Close changelog">
                ×
              </button>
            </div>
            <ChangelogPanel />
          </div>
        </div>
      )}

      {showSignInNotice && (
        <div className="settings-overlay" onClick={() => setShowSignInNotice(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span>Sign In</span>
              <button className="close-btn" onClick={() => setShowSignInNotice(false)} aria-label="Close">
                ×
              </button>
            </div>
            <p className="death-note">
              Accounts are coming soon. For now, your life is saved locally on this device.
            </p>
          </div>
        </div>
      )}

      {adminStage === 'login' && (
        <div className="settings-overlay" onClick={() => setAdminStage('closed')}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span>Admin Login</span>
              <button className="close-btn" onClick={() => setAdminStage('closed')} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={submitAdminLogin}>
              <label className="field-label">Password</label>
              <input
                className="name-input"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
              />
              {adminError && <p className="admin-error">Incorrect password.</p>}
              <button className="primary-btn" type="submit" style={{ marginTop: 12 }}>
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}

      {adminStage === 'open' && (
        <div className="settings-overlay" onClick={() => setAdminStage('closed')}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <span>Admin Panel</span>
              <button className="close-btn" onClick={() => setAdminStage('closed')} aria-label="Close">
                ×
              </button>
            </div>
            {character ? (
              <>
                <div className="admin-fields">
                  {STAT_ORDER.map((s) => (
                    <label key={s} className="admin-field">
                      <span className="field-label">{s}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={character.stats[s]}
                        onChange={(e) => setStat(s, Number(e.target.value))}
                      />
                    </label>
                  ))}
                  <label className="admin-field">
                    <span className="field-label">Money</span>
                    <input
                      type="number"
                      value={character.money}
                      onChange={(e) => setMoney(Number(e.target.value))}
                    />
                  </label>
                  <label className="admin-field">
                    <span className="field-label">Job</span>
                    <input
                      type="text"
                      value={character.job ?? ''}
                      onChange={(e) => setJob(e.target.value || null)}
                    />
                  </label>
                </div>
                <button
                  className="primary-btn admin-end-btn"
                  disabled={!character.alive}
                  onClick={endCharacter}
                >
                  {character.alive ? 'End Character' : 'Already Ended'}
                </button>
              </>
            ) : (
              <p className="death-note">No active character.</p>
            )}
          </div>
        </div>
      )}
    </>
  );

  // ===== Main menu =====
  if (screen === 'menu') {
    return (
      <>
        <div className="app start-screen">
          <div className="masthead">
            <h1 className="title">LIFE FILE</h1>
            <p className="subtitle">A life, one year at a time.</p>
            <p className="lives-tracker">Lives Lived: {livesLived}</p>
          </div>
          <div className="start-card">
            {character?.alive && (
              <div className="continue-row">
                <button className="primary-btn continue-btn" onClick={() => setScreen('game')}>
                  <span className="continue-label">Continue</span>
                  <span className="continue-meta">
                    {character.name} · Age {character.age}
                  </span>
                </button>
                <button
                  className="corner-btn corner-btn-danger delete-char-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete character"
                  title="Delete character"
                >
                  Delete
                </button>
              </div>
            )}
            <button
              className={character?.alive ? 'secondary-btn' : 'primary-btn'}
              onClick={() => setScreen('create')}
            >
              Start
            </button>
            <button className="secondary-btn" onClick={() => setShowSettings(true)}>
              Settings
            </button>
            <button className="secondary-btn" onClick={() => setShowChangelog(true)}>
              Changelog
            </button>
          </div>

          {showDeleteConfirm && character && (
            <div className="settings-overlay" onClick={() => setShowDeleteConfirm(false)}>
              <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                  <span>Delete Character</span>
                  <button className="close-btn" onClick={() => setShowDeleteConfirm(false)} aria-label="Close">
                    ×
                  </button>
                </div>
                <p className="death-note">
                  This will permanently delete {character.name} and cannot be undone. Are you sure?
                </p>
                <div className="confirm-actions">
                  <button className="secondary-btn" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => {
                      deleteCharacter();
                      setShowDeleteConfirm(false);
                    }}
                  >
                    Delete Character
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="contact-footer">Contact Information: dddxyf@outlook.com</p>
        </div>
        {globalUI}
      </>
    );
  }

  // ===== Character creation =====
  if (screen === 'create') {
    return (
      <>
        <div className="app start-screen">
          <div className="masthead">
            <h1 className="title">LIFE FILE</h1>
            <p className="subtitle">A life, one year at a time.</p>
          </div>
          <div className="start-card">
            <div className="field-row">
              <div className="field-col">
                <label className="field-label">First Name</label>
                <input
                  className="name-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Random"
                  maxLength={20}
                />
              </div>
              <div className="field-col">
                <label className="field-label">Last Name</label>
                <input
                  className="name-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Random"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Middle Name (optional)</label>
                <input
                  className="name-input"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="None"
                  maxLength={20}
                />
              </div>
              <div className="field-col">
                <label className="field-label">Suffix (optional)</label>
                <select
                  className="name-input"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                >
                  {SUFFIX_OPTIONS.map((s) => (
                    <option key={s || 'none'} value={s}>
                      {s || 'None'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-col">
              <label className="field-label">Gender</label>
              <div className="gender-toggle">
                <button
                  type="button"
                  className={`gender-btn ${gender === 'male' ? 'selected' : ''}`}
                  onClick={() => setGender('male')}
                >
                  Male
                </button>
                <button
                  type="button"
                  className={`gender-btn ${gender === 'female' ? 'selected' : ''}`}
                  onClick={() => setGender('female')}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="field-col">
              <label className="field-label">Country</label>
              <select className="name-input" value="USA" disabled>
                <option value="USA">United States</option>
              </select>
            </div>

            <button className="secondary-btn" onClick={randomizeIdentity}>
              Randomize
            </button>
            <button className="primary-btn" onClick={beginLife}>
              Begin a Life
            </button>
            <button className="link-btn" onClick={() => setScreen('menu')}>
              ← Back to Menu
            </button>
          </div>
        </div>
        {globalUI}
      </>
    );
  }

  if (!character) return null;
  const dead = !character.alive;

  // The left log column shows the age once on the birthday-month entry, the
  // abbreviated month for the next narrative entry of a new month, and
  // nothing for self-initiated actions or repeats within the same month.
  let lastLogAge: number | null = null;
  let lastLogMonth: number | null = null;
  const logRows = character.log.map((entry) => {
    let marker = '';
    if (entry.kind !== 'self') {
      if (lastLogAge !== entry.age || lastLogMonth !== entry.month) {
        marker = entry.month === 0 ? String(entry.age) : currentMonthAbbrev(character.birthMonth, entry.month);
      }
      lastLogAge = entry.age;
      lastLogMonth = entry.month;
    }
    return { entry, marker };
  });

  return (
    <>
      <div className="app">
        <div className="top-left-controls">
          <button className="corner-btn" onClick={() => setScreen('menu')}>
            Exit to Menu
          </button>
          <button className="corner-btn corner-btn-danger" onClick={() => setShowEndConfirm(true)}>
            End Game
          </button>
          <button
            className="corner-btn gear-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >
            ⚙
          </button>
        </div>

        {showEndConfirm && (
          <div className="settings-overlay" onClick={() => setShowEndConfirm(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>End Game</span>
                <button className="close-btn" onClick={() => setShowEndConfirm(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <p className="death-note">
                This will permanently delete {character.name} and cannot be undone. Are you sure?
              </p>
              <div className="confirm-actions">
                <button className="secondary-btn" onClick={() => setShowEndConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  onClick={() => {
                    deleteCharacter();
                    setShowEndConfirm(false);
                    setScreen('menu');
                  }}
                >
                  Delete Character
                </button>
              </div>
            </div>
          </div>
        )}

        {showInventory && (
          <div
            className="settings-overlay"
            onClick={() => {
              setShowInventory(false);
              setViewingItem(null);
            }}
          >
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>Inventory</span>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowInventory(false);
                    setViewingItem(null);
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <InventoryPanel items={character.inventory} onOpenItem={setViewingItem} />
            </div>
          </div>
        )}

        {viewingItem?.progressReport && (
          <div className="settings-overlay" onClick={() => setViewingItem(null)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>{viewingItem.name}</span>
                <button className="close-btn" onClick={() => setViewingItem(null)} aria-label="Close">
                  ×
                </button>
              </div>
              <ProgressReportView report={viewingItem.progressReport} />
            </div>
          </div>
        )}

        {showShop && (
          <div className="settings-overlay" onClick={() => setShowShop(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>Shop</span>
                <button className="close-btn" onClick={() => setShowShop(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <ShopPanel money={character.money} onBuy={buyItem} />
            </div>
          </div>
        )}

        {showBirthCertificate && (
          <div className="settings-overlay" onClick={() => setShowBirthCertificate(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>Birth Certificate</span>
                <button className="close-btn" onClick={() => setShowBirthCertificate(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <BirthCertificate character={character} />
            </div>
          </div>
        )}

        {showReportCard && (
          <div className="settings-overlay" onClick={() => setShowReportCard(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>Report Card</span>
                <button className="close-btn" onClick={() => setShowReportCard(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <ReportCard character={character} />
            </div>
          </div>
        )}

        {showStudyPanel && character.school && (
          <div className="settings-overlay" onClick={() => setShowStudyPanel(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>Study</span>
                <button className="close-btn" onClick={() => setShowStudyPanel(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <StudyPanel school={character.school} onStudy={interactWithSubject} />
            </div>
          </div>
        )}

        {showSchoolActions && character.school && (
          <div className="settings-overlay" onClick={() => setShowSchoolActions(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>School Actions</span>
                <button className="close-btn" onClick={() => setShowSchoolActions(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <SchoolActionsPanel
                school={character.school}
                onPerform={(actionId) => {
                  performSchoolAction(actionId);
                  setShowSchoolActions(false);
                  setView('log');
                }}
                onDropOut={() => {
                  quitSchool();
                  setShowSchoolActions(false);
                }}
              />
            </div>
          </div>
        )}

        {showParentInvolvement && character.school && (
          <div className="settings-overlay" onClick={() => setShowParentInvolvement(false)}>
            <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
              <div className="settings-header">
                <span>Parent Involvement</span>
                <button className="close-btn" onClick={() => setShowParentInvolvement(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <ParentInvolvementPanel character={character} onAskForHelp={askParentForHelp} />
            </div>
          </div>
        )}

        <div className="game-columns">
          <div className="game-col-left">
            <CharacterHeader character={character} onViewDetails={() => setShowBirthCertificate(true)} />

            <div className="feature-row">
              <button className="feature-btn" onClick={() => setShowInventory(true)}>
                <span className="feature-icon">🎒</span> Inventory
              </button>
              {character.age >= SHOP_MIN_AGE && (
                <button className="feature-btn" onClick={() => setShowShop(true)}>
                  <span className="feature-icon">🛍️</span> Shop
                </button>
              )}
            </div>

            <div className="stats-grid">
              {STAT_ORDER.map((s) => (
                <StatBar key={s} stat={s} value={character.stats[s]} />
              ))}
            </div>
          </div>

          <div className="game-col-right">
            <div className="stage">
              {showLicenseQuiz ? (
                <div className="event-card">
                  <div className="event-stamp">DMV</div>
                  <LicenseQuiz
                    onComplete={(score, passed) => {
                      resolveLicenseTest(score, passed);
                      setShowLicenseQuiz(false);
                    }}
                  />
                </div>
              ) : pendingEvent ? (
                <EventCard
                  event={pendingEvent}
                  character={character}
                  onChoose={(choice) => {
                    if (pendingEvent.id === DRIVERS_LICENSE_EVENT_ID && choice.text === TAKE_TEST_CHOICE_TEXT) {
                      setShowLicenseQuiz(true);
                      return;
                    }
                    if (pendingEvent.id === KINDERGARTEN_REPEAT_EVENT_ID) {
                      resolveKindergartenRepeatChoice(choice.text);
                      return;
                    }
                    chooseOption(choice);
                  }}
                />
              ) : (
                <>
                  <div className="tab-bar">
                    <button className={`tab-btn ${view === 'log' ? 'active' : ''}`} onClick={() => setView('log')}>
                      Life Record
                    </button>
                    <button
                      className={`tab-btn ${view === 'family' ? 'active' : ''}`}
                      onClick={() => setView('family')}
                    >
                      Family ({character.relatives.filter((r) => r.alive).length})
                    </button>
                    {character.school && (
                      <>
                        <button
                          className={`tab-btn ${view === 'school' ? 'active' : ''}`}
                          onClick={() => setView('school')}
                        >
                          School
                        </button>
                        <button
                          className={`tab-btn ${view === 'classmates' ? 'active' : ''}`}
                          onClick={() => setView('classmates')}
                        >
                          Classmates
                        </button>
                      </>
                    )}
                  </div>

                  {view === 'log' ? (
                    <div className="log-panel">
                      <div className="log-header">Life Record</div>
                      <div className="log-scroll">
                        {logRows.map(({ entry, marker }, i) => (
                          <div key={i} className="log-entry">
                            <span className="log-age">{marker}</span>
                            <div className="log-text-group">
                              <span className={`log-text ${entry.kind ? `log-text-${entry.kind}` : ''}`}>
                                {entry.text}
                              </span>
                              {entry.detail && (
                                <span className={`log-text ${entry.kind ? `log-text-${entry.kind}` : ''}`}>
                                  {entry.detail}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={logEndRef} />
                      </div>
                    </div>
                  ) : view === 'family' ? (
                    <FamilyPanel
                      relatives={character.relatives}
                      money={character.money}
                      characterAge={character.age}
                      onInteract={interactWithRelative}
                      conflict={lastFamilyConflict}
                    />
                  ) : view === 'school' ? (
                    <SchoolPanel
                      character={character}
                      onOpenReportCard={() => setShowReportCard(true)}
                      onOpenStudy={() => setShowStudyPanel(true)}
                      onOpenSchoolActions={() => setShowSchoolActions(true)}
                      onOpenParentInvolvement={() => setShowParentInvolvement(true)}
                      onRest={restAtHome}
                    />
                  ) : (
                    <ClassmatesPanel
                      school={character.school}
                      onInteract={interactWithClassmate}
                      conflict={lastClassmateConflict}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="controls">
          {dead ? (
            <div className="death-controls">
              <p className="death-note">
                {character.name} died of {character.causeOfDeath} at age {character.age}.
              </p>
              <button className="primary-btn" onClick={() => startNewLife()}>
                Start a New Life
              </button>
              <button className="secondary-btn" onClick={() => setScreen('menu')}>
                Back to Menu
              </button>
            </div>
          ) : character.age < MONTHLY_MODE_MIN_AGE ? (
            <button
              className="age-btn"
              onClick={ageUp}
              disabled={!!pendingEvent || !!schoolEnrollmentAlert}
              title={pendingEvent ? 'Resolve the event first' : 'Advance one year'}
            >
              Age Up <span className="age-plus">+1</span>
            </button>
          ) : (
            <button
              className="age-btn"
              onClick={nextMonth}
              disabled={!!pendingEvent || !!schoolEnrollmentAlert}
              title={pendingEvent ? 'Resolve the event first' : 'Advance one month'}
            >
              Next Month <span className="age-plus">→</span>
            </button>
          )}
        </div>
      </div>
      {globalUI}
      <Analytics />
    </>
  );
}
