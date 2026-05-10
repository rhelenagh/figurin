const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, soundEnabled = true) {
  if (!soundEnabled) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'jump':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    case 'score':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.05);
      osc.frequency.setValueAtTime(784, now + 0.1);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'powerup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.08);
      osc.frequency.setValueAtTime(784, now + 0.16);
      osc.frequency.setValueAtTime(1047, now + 0.24);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'death':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
  }
}

let bgmOscillators = [];
let bgmGain = null;
let bgmPlaying = false;
let bgmNoteIndex = 0;
let bgmNoteTimer = 0;

const bgmNotes = [
  261.63, 293.66, 329.63, 392.00, 440.00,
  392.00, 329.63, 293.66, 261.63, 293.66,
  329.63, 392.00, 440.00, 523.25, 587.33,
  523.25, 440.00, 392.00, 329.63, 261.63,
];

const bgmBass = [65.41, 73.42, 82.41, 98.00, 65.41, 73.42, 87.31, 65.41];

function startBgm(soundEnabled = true) {
  if (bgmPlaying || !soundEnabled) return;

  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);

  bgmPlaying = true;
  bgmNoteIndex = 0;
  bgmNoteTimer = 0;
}

function stopBgm() {
  bgmPlaying = false;
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  bgmOscillators = [];
  if (bgmGain) {
    bgmGain.disconnect();
    bgmGain = null;
  }
}

function updateBgm(soundEnabled = true, gameScreen = 'menu') {
  if (!bgmPlaying || !soundEnabled || gameScreen !== 'playing') return;

  bgmNoteTimer++;

  if (bgmNoteTimer >= 8) {
    bgmNoteTimer = 0;

    const now = audioCtx.currentTime;

    const leadOsc = audioCtx.createOscillator();
    const leadGain = audioCtx.createGain();
    leadOsc.type = 'square';
    leadOsc.frequency.setValueAtTime(bgmNotes[bgmNoteIndex % bgmNotes.length], now);
    leadGain.gain.setValueAtTime(0.08, now);
    leadGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    leadOsc.connect(leadGain);
    leadGain.connect(bgmGain);
    leadOsc.start(now);
    leadOsc.stop(now + 0.15);

    if (bgmNoteIndex % 2 === 0) {
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bgmBass[Math.floor(bgmNoteIndex / 2) % bgmBass.length], now);
      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      bassOsc.connect(bassGain);
      bassGain.connect(bgmGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.3);
    }

    if (bgmNoteIndex % 4 === 2) {
      const hihatOsc = audioCtx.createOscillator();
      const hihatGain = audioCtx.createGain();
      hihatOsc.type = 'square';
      hihatOsc.frequency.setValueAtTime(2000, now);
      hihatGain.gain.setValueAtTime(0.02, now);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      hihatOsc.connect(hihatGain);
      hihatGain.connect(bgmGain);
      hihatOsc.start(now);
      hihatOsc.stop(now + 0.03);
    }

    bgmNoteIndex++;
  }
}

function resumeAudioContext() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

window.audioExport = {
  playSound,
  startBgm,
  stopBgm,
  updateBgm,
  resumeAudioContext,
};