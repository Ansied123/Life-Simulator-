const clickAudio = new Audio('/Sounds/click4.ogg');
const switchAudio = new Audio('/Sounds/switch1.ogg');

const mainMenuMusic = new Audio('/Sounds/Main_Menu.wav');
mainMenuMusic.loop = true;
mainMenuMusic.volume = 0.5;
const inGameMusic = new Audio('/Sounds/In-Game.wav');
inGameMusic.loop = true;
inGameMusic.volume = 0.5;

// Mutes only the one-shot button/switch sound effects; background music
// volume is controlled independently via setMusicVolume.
let muted = false;
let initialized = false;
// The background track that should currently be playing, regardless of
// whether autoplay restrictions are letting it actually play yet.
let currentMusic: HTMLAudioElement | null = null;

export function setSoundMuted(value: boolean): void {
  muted = value;
}

// 0-100; applies to both music tracks so whichever becomes active next
// already has the right level.
export function setMusicVolume(percent: number): void {
  const v = Math.max(0, Math.min(100, percent)) / 100;
  mainMenuMusic.volume = v;
  inGameMusic.volume = v;
}

function play(audio: HTMLAudioElement): void {
  if (muted) return;
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Blocked by autoplay/gesture restrictions; not worth surfacing.
  });
}

export function playClickSound(): void {
  play(clickAudio);
}

export function playSwitchSound(): void {
  play(switchAudio);
}

// Switches the looping background track, picking up where autoplay policy
// allows: if the browser blocked the initial play() (no user gesture yet),
// initButtonSounds retries it on the next click. Always attempts to play —
// audibility is governed by setMusicVolume, not the SFX mute flag.
function playMusic(audio: HTMLAudioElement): void {
  if (currentMusic === audio) return;
  currentMusic?.pause();
  if (currentMusic) currentMusic.currentTime = 0;
  currentMusic = audio;
  audio.play().catch(() => {
    // Blocked by autoplay/gesture restrictions; the next click retries it.
  });
}

export function playMainMenuMusic(): void {
  playMusic(mainMenuMusic);
}

export function playInGameMusic(): void {
  playMusic(inGameMusic);
}

// Wires every button click in the app to a sound, without touching every
// individual onClick handler: toggle switches get the switch sound, every
// other button gets the click sound. Listens on the capture phase so modal
// panels calling stopPropagation() (to avoid closing themselves) don't
// also swallow the sound.
export function initButtonSounds(): void {
  if (initialized) return;
  initialized = true;
  document.addEventListener(
    'click',
    (e) => {
      if (currentMusic && currentMusic.paused) {
        currentMusic.play().catch(() => {
          // Still blocked; will retry on the next click.
        });
      }
      const button = (e.target as HTMLElement).closest('button');
      if (!button) return;
      if (button.classList.contains('toggle-switch')) {
        playSwitchSound();
      } else {
        playClickSound();
      }
    },
    { capture: true }
  );
}
