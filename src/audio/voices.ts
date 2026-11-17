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
  voice: string,
  time: number,
  velocity: number,
): void {
  const level = Math.max(0, Math.min(1, velocity));
  switch (voice) {
    case "tram":
      bell(ctx, dest, noise, time, 720, 0.9, 0.4 * level);
      break;
    case "bell":
      bikeBell(ctx, dest, noise, time, level);
      break;
    case "cobbles":
      cobbles(ctx, dest, noise, time, level);
      break;
    case "canal":
      canal(ctx, dest, noise, time, level);
      break;
    case "carillon":
      bell(ctx, dest, noise, time, 523, 1.5, 0.42 * level);
      break;
    case "bridge":
      horn(ctx, dest, noise, time, [196], 0.22, 0.26 * level);
      horn(ctx, dest, noise, time + 0.26, [196], 0.22, 0.22 * level);
      break;
    default:
      break;
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
