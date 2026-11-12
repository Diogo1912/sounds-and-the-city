import type { DrumId } from "../types.ts";

export function makeNoise(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

export function triggerDrum(
  ctx: AudioContext,
  dest: AudioNode,
  noise: AudioBuffer,
  drum: DrumId,
  time: number,
  velocity: number,
): void {
  const level = Math.max(0, Math.min(1, velocity));
  switch (drum) {
    case "kick":
      tone(ctx, dest, "sine", 156, 48, time, 0.9 * level, 0.005, 0.28);
      tone(ctx, dest, "square", 180, 90, time, 0.08 * level, 0.001, 0.02);
      break;
    case "snare":
      noiseBurst(ctx, dest, noise, time, 0.34 * level, 0.004, 0.14, { type: "highpass", freq: 1400 });
      tone(ctx, dest, "triangle", 196, 160, time, 0.2 * level, 0.002, 0.08);
      break;
    case "hat":
      noiseBurst(ctx, dest, noise, time, 0.2 * level, 0.001, 0.04, { type: "highpass", freq: 7000 });
      break;
    case "tom":
      tone(ctx, dest, "sine", 168, 92, time, 0.48 * level, 0.004, 0.2);
      break;
    case "clap":
      noiseBurst(ctx, dest, noise, time, 0.22 * level, 0.001, 0.04, { type: "bandpass", freq: 1400, q: 0.8 });
      noiseBurst(ctx, dest, noise, time + 0.012, 0.2 * level, 0.001, 0.05, { type: "bandpass", freq: 1400, q: 0.8 });
      noiseBurst(ctx, dest, noise, time + 0.026, 0.26 * level, 0.001, 0.12, { type: "bandpass", freq: 1200, q: 0.7 });
      break;
    case "rim":
      tone(ctx, dest, "square", 420, 280, time, 0.16 * level, 0.001, 0.03);
      tone(ctx, dest, "sine", 1750, 1400, time, 0.08 * level, 0.001, 0.018);
      break;
  }
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
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), time + decay);
  const gain = envelope(ctx, time, peak, attack, decay);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + attack + decay + 0.02);
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
  source.stop(time + attack + decay + 0.02);
}

function envelope(ctx: AudioContext, time: number, peak: number, attack: number, decay: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  return gain;
}
