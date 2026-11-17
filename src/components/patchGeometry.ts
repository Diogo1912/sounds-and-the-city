import type { SynthPatch } from "../synthPatch.ts";

export type Envelope = Pick<SynthPatch, "attack" | "decay" | "sustain" | "release">;
export type EnvelopePoint = "attack" | "decay" | "release";

export const ENV_POINTS = ["attack", "decay", "release"] as const;
const timing = { attack: [1, 2000], decay: [5, 2500], release: [5, 3000] } as const;

function bounded(value: number) {
  return Math.min(1, Math.max(0, value));
}

function fraction(value: number, low: number, high: number) {
  return bounded(Math.log(value / low) / Math.log(high / low));
}

function duration(normalized: number, low: number, high: number) {
  return Math.round(low * (high / low) ** bounded(normalized));
}

export function envelopePoints(envelope: Envelope) {
  const peak = 0.08 + 0.22 * fraction(envelope.attack, ...timing.attack);
  const decay = peak + 0.045 + 0.20 * fraction(envelope.decay, ...timing.decay);
  const hold = decay + 0.14;
  const end = hold + 0.035 + 0.23 * fraction(envelope.release, ...timing.release);
  return {
    start: [0.025, 0.86],
    attack: [peak, 0.14],
    decay: [decay, 0.86 - 0.72 * envelope.sustain / 100],
    hold: [hold, 0.86 - 0.72 * envelope.sustain / 100],
    release: [end, 0.86],
  } as const;
}

export function moveEnvelope(envelope: Envelope, handle: EnvelopePoint, x: number, y: number): Envelope {
  const { attack, hold } = envelopePoints(envelope);
  if (handle === "attack") return { ...envelope, attack: duration((x - 0.08) / 0.22, ...timing.attack) };
  if (handle === "decay") return {
    ...envelope,
    decay: duration((x - attack[0] - 0.045) / 0.20, ...timing.decay),
    sustain: Math.round(100 * bounded((0.86 - y) / 0.72)),
  };
  return { ...envelope, release: duration((x - hold[0] - 0.035) / 0.23, ...timing.release) };
}

export function waveform(shape: SynthPatch["waveA"], cycle: number): number {
  const phase = cycle - Math.floor(cycle);
  switch (shape) {
    case "triangle": return 1 - 4 * Math.abs(phase - 0.5);
    case "sawtooth": return 2 * phase - 1;
    case "square": return phase < 0.5 ? 1 : -1;
    case "sine": return Math.sin(phase * Math.PI * 2);
  }
}
