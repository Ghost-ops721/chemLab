/** Tiny Web Audio cues — no asset files, instant interactivity. */

const MUTE_KEY = "chemlab-muted";

let ctx: AudioContext | null = null;
let muted =
  typeof window !== "undefined" &&
  window.localStorage?.getItem(MUTE_KEY) === "1";

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.04,
  when = 0,
) {
  if (muted) return;
  const audio = ac();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const t0 = audio.currentTime + when;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function persistMute(next: boolean) {
  muted = next;
  try {
    window.localStorage?.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export const labSound = {
  isMuted() {
    return muted;
  },
  setMuted(next: boolean) {
    persistMute(next);
  },
  toggleMute() {
    persistMute(!muted);
    return muted;
  },
  pour() {
    beep(420, 0.1, "triangle", 0.045);
    beep(280, 0.14, "sine", 0.032, 0.05);
    beep(360, 0.08, "sine", 0.02, 0.12);
  },
  stir() {
    beep(180, 0.06, "sawtooth", 0.025);
    beep(220, 0.08, "sine", 0.022, 0.07);
  },
  shake() {
    beep(160, 0.04, "square", 0.022);
    beep(240, 0.05, "square", 0.018, 0.05);
    beep(190, 0.04, "square", 0.016, 0.1);
  },
  mix() {
    beep(520, 0.07, "sine", 0.05);
    beep(660, 0.1, "triangle", 0.038, 0.06);
    beep(880, 0.14, "sine", 0.03, 0.14);
  },
  heat() {
    beep(90, 0.28, "sawtooth", 0.022);
    beep(70, 0.2, "sawtooth", 0.015, 0.1);
  },
  hazard() {
    beep(140, 0.18, "square", 0.05);
    beep(110, 0.22, "square", 0.04, 0.12);
  },
  bubble() {
    beep(700 + Math.random() * 200, 0.05, "sine", 0.02);
  },
  place() {
    beep(320, 0.06, "triangle", 0.035);
  },
  clear() {
    beep(240, 0.05, "sine", 0.025);
  },
  ppt() {
    beep(200, 0.12, "triangle", 0.03);
    beep(150, 0.16, "sine", 0.02, 0.08);
  },
  reward() {
    beep(523, 0.1, "sine", 0.04);
    beep(659, 0.12, "sine", 0.035, 0.1);
    beep(784, 0.18, "triangle", 0.03, 0.2);
  },
};
