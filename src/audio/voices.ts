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
  const key = `${city}:${voice}`;
  switch (key) {
    case "new-york:subway":
      tone(ctx, dest, "sine", 128, 42, time, 0.85 * level, 0.004, 0.2);
      noiseBurst(ctx, dest, noise, time, 0.18 * level, 0.001, 0.03, { type: "highpass", freq: 1800 });
      tone(ctx, dest, "sine", 90, 48, time + 0.04, 0.35 * level, 0.002, 0.12);
      break;
    case "new-york:horn":
      blat(ctx, dest, noise, time, [349, 466], 0.16, 0.28 * level);
      break;
    case "new-york:turnstile":
      metal(ctx, dest, noise, time, 3200, 0.02, 0.22 * level);
      metal(ctx, dest, noise, time + 0.012, 2400, 0.016, 0.12 * level);
      break;
    case "new-york:steam":
      noiseBurst(ctx, dest, noise, time, 0.16 * level, 0.01, 0.22, { type: "bandpass", freq: 1600, q: 0.8 });
      break;
    case "new-york:chime":
      tone(ctx, dest, "sine", 784, 784, time, 0.22 * level, 0.003, 0.28);
      tone(ctx, dest, "sine", 1046, 1046, time + 0.08, 0.16 * level, 0.003, 0.32);
      break;
    case "new-york:hammer":
      for (let hit = 0; hit < 6; hit += 1) {
        noiseBurst(ctx, dest, noise, time + hit * 0.028, 0.2 * level, 0.001, 0.02, { type: "highpass", freq: 900 });
      }
      break;
    case "amsterdam:tram":
      fmBell(ctx, dest, time, 294, 1.5, 0.85, 0.45 * level);
      break;
    case "amsterdam:bell":
      fmBell(ctx, dest, time, 2093, 2.7, 0.28, 0.28 * level);
      break;
    case "amsterdam:cobbles":
      tone(ctx, dest, "sine", 170, 90, time, 0.2 * level, 0.002, 0.05);
      noiseBurst(ctx, dest, noise, time, 0.14 * level, 0.001, 0.03, { type: "bandpass", freq: 900, q: 1.2 });
      break;
    case "amsterdam:canal":
      tone(ctx, dest, "sine", 220, 70, time, 0.18 * level, 0.004, 0.16);
      noiseBurst(ctx, dest, noise, time, 0.12 * level, 0.008, 0.18, { type: "lowpass", freq: 700 });
      break;
    case "amsterdam:carillon":
      fmBell(ctx, dest, time, 740, 2.2, 1.15, 0.32 * level);
      tone(ctx, dest, "sine", 1480, 1480, time, 0.06 * level, 0.002, 0.4);
      break;
    case "amsterdam:bridge":
      blat(ctx, dest, noise, time, [155], 0.32, 0.22 * level);
      break;
    case "tokyo:train":
      tone(ctx, dest, "sine", 78, 40, time, 0.7 * level, 0.004, 0.18);
      noiseBurst(ctx, dest, noise, time, 0.14 * level, 0.02, 0.16, { type: "lowpass", freq: 500 });
      break;
    case "tokyo:crossing":
      beep(ctx, dest, time, 2093, 0.06, 0.16 * level);
      beep(ctx, dest, time + 0.08, 2489, 0.06, 0.16 * level);
      break;
    case "tokyo:gate":
      beep(ctx, dest, time, 1046, 0.045, 0.18 * level);
      break;
    case "tokyo:rail":
      metal(ctx, dest, noise, time, 1800, 0.02, 0.16 * level);
      metal(ctx, dest, noise, time + 0.08, 1400, 0.02, 0.12 * level);
      break;
    case "tokyo:door":
      tone(ctx, dest, "sine", 880, 880, time, 0.12 * level, 0.004, 0.16);
      tone(ctx, dest, "sine", 1175, 1175, time + 0.09, 0.1 * level, 0.004, 0.2);
      break;
    case "tokyo:bowl":
      tone(ctx, dest, "sine", 440, 440, time, 0.16 * level, 0.01, 1.3);
      tone(ctx, dest, "sine", 443, 443, time, 0.12 * level, 0.01, 1.3);
      tone(ctx, dest, "sine", 880, 880, time, 0.04 * level, 0.005, 0.6);
      break;
    case "london:bell":
      fmBell(ctx, dest, time, 196, 1.42, 1.35, 0.5 * level);
      tone(ctx, dest, "sine", 392, 392, time, 0.08 * level, 0.004, 0.8);
      break;
    case "london:tube":
      beep(ctx, dest, time, 1568, 0.05, 0.14 * level);
      beep(ctx, dest, time + 0.09, 1568, 0.05, 0.12 * level);
      break;
    case "london:cab":
      blat(ctx, dest, noise, time, [311], 0.14, 0.24 * level);
      break;
    case "london:bus":
      tone(ctx, dest, "sine", 1318, 1318, time, 0.2 * level, 0.002, 0.22);
      tone(ctx, dest, "sine", 2637, 2637, time, 0.06 * level, 0.002, 0.12);
      break;
    case "london:rain":
      noiseBurst(ctx, dest, noise, time, 0.1 * level, 0.001, 0.04, { type: "highpass", freq: 5000 });
      noiseBurst(ctx, dest, noise, time + 0.03, 0.06 * level, 0.001, 0.03, { type: "highpass", freq: 7000 });
      break;
    case "london:diesel":
      tone(ctx, dest, "sine", 58, 46, time, 0.45 * level, 0.008, 0.24);
      noiseBurst(ctx, dest, noise, time, 0.1 * level, 0.01, 0.2, { type: "lowpass", freq: 240 });
      break;
    default:
      break;
  }
}

function beep(ctx: AudioContext, dest: AudioNode, time: number, freq: number, decay: number, peak: number): void {
  tone(ctx, dest, "sine", freq, freq, time, peak, 0.002, decay);
}

function blat(
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
  filter.frequency.setValueAtTime(900, time);
  filter.Q.setValueAtTime(3, time);
  const gain = envelope(ctx, time, peak, 0.006, decay);
  filter.connect(gain);
  gain.connect(dest);
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, time + decay);
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + decay + 0.03);
  }
  const spit = ctx.createBufferSource();
  spit.buffer = buffer;
  const spitGain = envelope(ctx, time, peak * 0.25, 0.001, 0.03);
  spit.connect(spitGain);
  spitGain.connect(dest);
  spit.start(time, Math.random());
  spit.stop(time + 0.04);
}

function fmBell(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  carrier: number,
  ratio: number,
  decay: number,
  peak: number,
): void {
  const modulator = ctx.createOscillator();
  const amount = ctx.createGain();
  const voice = ctx.createOscillator();
  const amp = envelope(ctx, time, peak, 0.002, decay);
  modulator.frequency.setValueAtTime(carrier * ratio, time);
  amount.gain.setValueAtTime(carrier * 3.2, time);
  amount.gain.exponentialRampToValueAtTime(1, time + decay);
  modulator.connect(amount);
  amount.connect(voice.frequency);
  voice.frequency.setValueAtTime(carrier, time);
  voice.connect(amp);
  amp.connect(dest);
  modulator.start(time);
  voice.start(time);
  modulator.stop(time + decay + 0.05);
  voice.stop(time + decay + 0.05);
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
  noiseBurst(ctx, dest, buffer, time, peak, 0.001, decay, { type: "bandpass", freq, q: 6 });
  tone(ctx, dest, "square", freq, freq * 0.5, time, peak * 0.15, 0.001, decay);
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
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), time);
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), time + decay);
  const gain = envelope(ctx, time, peak, attack, decay);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + attack + decay + 0.03);
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
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), time + Math.max(0.001, attack));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  return gain;
}
