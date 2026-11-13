import type { CityId } from "../types.ts";

export function makeNoise(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

export function triggerVoice(
  ctx: AudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  city: CityId,
  voice: string,
  time: number,
  velocity: number,
): void {
  const level = Math.max(0, Math.min(1, velocity));
  switch (`${city}:${voice}`) {
    case "new-york:subway":
      subway(ctx, dest, noise, time, level);
      break;
    case "new-york:horn":
      horn(ctx, dest, noise, time, [392, 466], 0.2, 0.32 * level);
      break;
    case "new-york:turnstile":
      turnstile(ctx, dest, noise, time, level);
      break;
    case "new-york:steam":
      radiator(ctx, dest, noise, time, level);
      break;
    case "new-york:chime":
      bell(ctx, dest, noise, time, 988, 0.45, 0.28 * level);
      bell(ctx, dest, noise, time + 0.11, 740, 0.55, 0.22 * level);
      break;
    case "new-york:hammer":
      jackhammer(ctx, dest, noise, time, level);
      break;
    case "amsterdam:tram":
      bell(ctx, dest, noise, time, 720, 0.9, 0.4 * level);
      break;
    case "amsterdam:bell":
      bikeBell(ctx, dest, noise, time, level);
      break;
    case "amsterdam:cobbles":
      cobbles(ctx, dest, noise, time, level);
      break;
    case "amsterdam:canal":
      canal(ctx, dest, noise, time, level);
      break;
    case "amsterdam:carillon":
      bell(ctx, dest, noise, time, 523, 1.5, 0.42 * level);
      break;
    case "amsterdam:bridge":
      horn(ctx, dest, noise, time, [196], 0.22, 0.26 * level);
      horn(ctx, dest, noise, time + 0.26, [196], 0.22, 0.22 * level);
      break;
    case "tokyo:train":
      train(ctx, dest, noise, time, level);
      break;
    case "tokyo:crossing":
      speakerBeep(ctx, dest, time, 2093, 0.055, 0.16 * level);
      speakerBeep(ctx, dest, time + 0.09, 2489, 0.055, 0.16 * level);
      break;
    case "tokyo:gate":
      speakerBeep(ctx, dest, time, 1318, 0.04, 0.14 * level);
      metal(ctx, dest, noise, time + 0.05, 1800, 0.015, 0.12 * level);
      metal(ctx, dest, noise, time + 0.07, 900, 0.02, 0.08 * level);
      break;
    case "tokyo:rail":
      metal(ctx, dest, noise, time, 2400, 0.018, 0.2 * level);
      metal(ctx, dest, noise, time + 0.07, 1600, 0.018, 0.14 * level);
      break;
    case "tokyo:door":
      speakerBeep(ctx, dest, time, 880, 0.08, 0.1 * level);
      speakerBeep(ctx, dest, time + 0.1, 659, 0.1, 0.09 * level);
      break;
    case "tokyo:bowl":
      bowl(ctx, dest, noise, time, level);
      break;
    case "london:bell":
      bell(ctx, dest, noise, time, 196, 1.8, 0.55 * level);
      break;
    case "london:tube":
      alarm(ctx, dest, time, 1850, 0.07, 0.14 * level);
      alarm(ctx, dest, time + 0.1, 1850, 0.07, 0.12 * level);
      break;
    case "london:cab":
      horn(ctx, dest, noise, time, [370], 0.16, 0.22 * level);
      break;
    case "london:bus":
      ding(ctx, dest, noise, time, level);
      ding(ctx, dest, noise, time + 0.12, level * 0.85);
      break;
    case "london:rain":
      drop(ctx, dest, noise, time, level);
      drop(ctx, dest, noise, time + 0.045, level * 0.7);
      drop(ctx, dest, noise, time + 0.1, level * 0.5);
      break;
    case "london:diesel":
      diesel(ctx, dest, noise, time, level);
      break;
    default:
      break;
  }
}

function subway(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  tone(ctx, dest, "sine", 72, 40, time, 0.55 * level, 0.01, 0.28);
  noiseBurst(ctx, dest, buffer, time, 0.12 * level, 0.02, 0.22, { type: "lowpass", freq: 280 });
  metal(ctx, dest, buffer, time, 1400, 0.02, 0.22 * level);
  metal(ctx, dest, buffer, time + 0.045, 900, 0.025, 0.16 * level);
}

function turnstile(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  for (let hit = 0; hit < 4; hit += 1) {
    metal(ctx, dest, buffer, time + hit * 0.016, 3600 - hit * 400, 0.012, (0.16 - hit * 0.02) * level);
  }
  tone(ctx, dest, "triangle", 280, 140, time + 0.07, 0.18 * level, 0.001, 0.04);
}

function radiator(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  noiseBurst(ctx, dest, buffer, time, 0.14 * level, 0.02, 0.16, { type: "bandpass", freq: 2400, q: 0.7 });
  bell(ctx, dest, buffer, time + 0.08, 680, 0.22, 0.16 * level);
  bell(ctx, dest, buffer, time + 0.2, 540, 0.18, 0.1 * level);
}

function jackhammer(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  for (let hit = 0; hit < 9; hit += 1) {
    noiseBurst(ctx, dest, buffer, time + hit * 0.026, 0.22 * level, 0.001, 0.016, { type: "highpass", freq: 700 });
    tone(ctx, dest, "sine", 90, 50, time + hit * 0.026, 0.2 * level, 0.001, 0.02);
  }
}

function bikeBell(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  bell(ctx, dest, buffer, time, 2480, 0.16, 0.22 * level);
  bell(ctx, dest, buffer, time + 0.09, 2630, 0.18, 0.2 * level);
}

function cobbles(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  const gaps = [0, 0.028, 0.05, 0.084, 0.11];
  gaps.forEach((gap, index) => {
    tone(ctx, dest, "sine", 150 - index * 8, 80, time + gap, 0.16 * level, 0.001, 0.04);
    noiseBurst(ctx, dest, buffer, time + gap, 0.06 * level, 0.001, 0.02, { type: "bandpass", freq: 700, q: 1 });
  });
}

function canal(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  tone(ctx, dest, "sine", 340, 70, time, 0.22 * level, 0.004, 0.18);
  noiseBurst(ctx, dest, buffer, time + 0.02, 0.16 * level, 0.01, 0.22, { type: "lowpass", freq: 600 });
}

function train(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  tone(ctx, dest, "sawtooth", 160, 480, time, 0.08 * level, 0.02, 0.28);
  tone(ctx, dest, "sine", 70, 48, time, 0.4 * level, 0.01, 0.24);
  noiseBurst(ctx, dest, buffer, time + 0.18, 0.08 * level, 0.01, 0.12, { type: "highpass", freq: 3000 });
}

function bowl(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  noiseBurst(ctx, dest, buffer, time, 0.08 * level, 0.001, 0.02, { type: "bandpass", freq: 1200, q: 2 });
  tone(ctx, dest, "sine", 294, 294, time, 0.16 * level, 0.008, 1.6);
  tone(ctx, dest, "sine", 296.4, 296.4, time, 0.12 * level, 0.008, 1.6);
  tone(ctx, dest, "sine", 588, 588, time, 0.04 * level, 0.004, 0.7);
}

function ding(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  tone(ctx, dest, "sine", 1568, 1568, time, 0.2 * level, 0.001, 0.14);
  tone(ctx, dest, "sine", 3136, 3136, time, 0.06 * level, 0.001, 0.08);
  noiseBurst(ctx, dest, buffer, time, 0.05 * level, 0.001, 0.012, { type: "highpass", freq: 4000 });
}

function diesel(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  for (let chug = 0; chug < 4; chug += 1) {
    const at = time + chug * 0.07;
    tone(ctx, dest, "sine", 62, 42, at, 0.35 * level, 0.004, 0.05);
    noiseBurst(ctx, dest, buffer, at, 0.08 * level, 0.002, 0.04, { type: "lowpass", freq: 300 });
  }
}

function drop(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, time: number, level: number): void {
  tone(ctx, dest, "sine", 1400, 380, time, 0.08 * level, 0.001, 0.05);
  noiseBurst(ctx, dest, buffer, time, 0.04 * level, 0.001, 0.03, { type: "highpass", freq: 2000 });
}

function horn(
  ctx: AudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  time: number,
  freqs: number[],
  decay: number,
  peak: number,
): void {
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1100, time);
  filter.Q.setValueAtTime(4.5, time);
  const gain = envelope(ctx, time, peak, 0.008, decay);
  filter.connect(gain);
  gain.connect(dest);
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.94), time + decay);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + decay + 0.03);
  }
  noiseBurst(ctx, dest, buffer, time, peak * 0.35, 0.001, 0.02, { type: "highpass", freq: 1500 });
}

function speakerBeep(ctx: AudioContext, dest: AudioNode, time: number, freq: number, decay: number, peak: number): void {
  tone(ctx, dest, "sine", freq, freq, time, peak, 0.001, decay);
  tone(ctx, dest, "square", freq, freq, time, peak * 0.08, 0.001, decay * 0.6);
}

function alarm(ctx: AudioContext, dest: AudioNode, time: number, freq: number, decay: number, peak: number): void {
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(900, time);
  const gain = envelope(ctx, time, peak, 0.001, decay);
  filter.connect(gain);
  gain.connect(dest);
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, time);
  osc.connect(filter);
  osc.start(time);
  osc.stop(time + decay + 0.02);
}

function bell(
  ctx: AudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  time: number,
  prime: number,
  decay: number,
  peak: number,
): void {
  const partials: [number, number, number][] = [
    [0.5, 0.35, 1.35],
    [1, 0.5, 1],
    [1.19, 0.32, 0.9],
    [1.5, 0.16, 0.7],
    [2, 0.22, 0.5],
    [2.55, 0.08, 0.35],
  ];
  for (const [ratio, amp, decayScale] of partials) {
    tone(ctx, dest, "sine", prime * ratio, prime * ratio, time, peak * amp, 0.002, decay * decayScale);
  }
  noiseBurst(ctx, dest, buffer, time, peak * 0.25, 0.001, 0.012, { type: "highpass", freq: 2000 });
}

function metal(
  ctx: AudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  time: number,
  freq: number,
  decay: number,
  peak: number,
): void {
  noiseBurst(ctx, dest, buffer, time, peak, 0.001, decay, { type: "bandpass", freq, q: 8 });
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  freqEnd: number,
  time: number,
  peak: number,
  attack: number,
  decay: number,
): void {
  if (peak <= 0.0005) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), time);
  if (Math.abs(freqEnd - freq) > 0.5) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), time + Math.max(0.01, decay));
  }
  const gain = envelope(ctx, time, peak, attack, decay);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + attack + decay + 0.04);
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  buffer: AudioBuffer,
  time: number,
  peak: number,
  attack: number,
  decay: number,
  filter: { type: BiquadFilterType; freq: number; q?: number },
): void {
  if (peak <= 0.0005) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter.type;
  biquad.frequency.setValueAtTime(filter.freq, time);
  if (filter.q) biquad.Q.setValueAtTime(filter.q, time);
  const gain = envelope(ctx, time, peak, attack, decay);
  source.connect(biquad);
  biquad.connect(gain);
  gain.connect(dest);
  const offset = Math.random() * Math.max(0, buffer.duration - decay - 0.05);
  source.start(time, offset);
  source.stop(time + attack + decay + 0.03);
}

function envelope(ctx: AudioContext, time: number, peak: number, attack: number, decay: number): GainNode {
  const gain = ctx.createGain();
  const safePeak = Math.max(0.001, peak);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(safePeak, time + Math.max(0.001, attack));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + Math.max(0.01, decay));
  return gain;
}
