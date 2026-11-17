import type { CityId } from "./types.ts";

export const WAVEFORMS = ["sine", "triangle", "sawtooth", "square"] as const;
export const OSC_MODES = ["mix", "fm"] as const;
export const FILTER_TYPES = ["lowpass", "highpass", "bandpass", "notch"] as const;
export const LFO_TARGETS = ["pitch", "filter", "amp"] as const;

export const PATCH_RANGES = {
  tuneA: [-24, 24, 1],
  tuneB: [-24, 24, 1],
  detuneB: [-50, 50, 1],
  mix: [0, 100, 1],
  fmRatio: [0.25, 8, 0.25],
  fmDepth: [0, 100, 1],
  sub: [0, 100, 1],
  noise: [0, 100, 1],
  cutoff: [0, 100, 1],
  resonance: [0, 100, 1],
  filterEnv: [-48, 48, 1],
  filterAttack: [1, 2000, 1],
  filterDecay: [5, 2500, 1],
  filterSustain: [0, 100, 1],
  filterRelease: [5, 3000, 1],
  keyTrack: [0, 100, 1],
  attack: [1, 2000, 1],
  decay: [5, 2500, 1],
  sustain: [0, 100, 1],
  release: [5, 3000, 1],
  lfoRate: [0.1, 20, 0.1],
  lfoDepth: [0, 100, 1],
  gate: [5, 100, 1],
  level: [0, 100, 1],
  drive: [0, 100, 1],
  pan: [-100, 100, 1],
} as const;

export type PatchControl = keyof typeof PATCH_RANGES;
export type SynthPatch = Record<PatchControl, number> & {
  waveA: (typeof WAVEFORMS)[number];
  waveB: (typeof WAVEFORMS)[number];
  mode: (typeof OSC_MODES)[number];
  filter: (typeof FILTER_TYPES)[number];
  lfoWave: (typeof WAVEFORMS)[number];
  lfoTarget: (typeof LFO_TARGETS)[number];
};

export const INIT_PATCH: SynthPatch = {
  waveA: "sine", tuneA: 0,
  waveB: "triangle", tuneB: 0, detuneB: 0,
  mode: "mix", mix: 0, fmRatio: 2, fmDepth: 0, sub: 0, noise: 0,
  filter: "lowpass", cutoff: 100, resonance: 0, filterEnv: 0,
  filterAttack: 5, filterDecay: 260, filterSustain: 15, filterRelease: 160, keyTrack: 0,
  attack: 5, decay: 200, sustain: 75, release: 160,
  lfoWave: "sine", lfoTarget: "pitch", lfoRate: 5, lfoDepth: 0,
  gate: 70, level: 75, drive: 0, pan: 0,
};

export const CITY_PATCHES: Record<CityId, SynthPatch> = {
  "new-york": {
    ...INIT_PATCH, waveA: "sawtooth", sub: 35, cutoff: 35, resonance: 9, filterEnv: 21,
    attack: 5, decay: 250, sustain: 24, release: 170, level: 65,
  },
  amsterdam: {
    ...INIT_PATCH, waveA: "triangle", waveB: "sine", tuneB: 12, mix: 22,
    cutoff: 65, filterEnv: 10, decay: 420, sustain: 4, release: 210, level: 78,
  },
  tokyo: {
    ...INIT_PATCH, mode: "fm", waveB: "sine", fmRatio: 2, fmDepth: 30,
    cutoff: 70, resonance: 15, attack: 3, decay: 300, sustain: 10, release: 210, level: 61,
  },
  london: {
    ...INIT_PATCH, waveA: "square", waveB: "square", tuneB: 7, mix: 24,
    cutoff: 72, attack: 7, decay: 280, sustain: 67, release: 280,
    lfoTarget: "amp", lfoRate: 4.2, lfoDepth: 12, level: 59,
  },
};

export function cutoffHz(value: number): number {
  return 45 * (16000 / 45) ** (value / 100);
}

function readOption<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return choices.find((choice) => choice === value) ?? fallback;
}

export function readPatch(value: unknown, fallback: SynthPatch): SynthPatch {
  if (value === null || typeof value !== "object") return { ...fallback };
  const stored = value as Record<string, unknown>;
  const patch: SynthPatch = {
    ...fallback,
    waveA: readOption(stored.waveA, WAVEFORMS, fallback.waveA),
    waveB: readOption(stored.waveB, WAVEFORMS, fallback.waveB),
    mode: readOption(stored.mode, OSC_MODES, fallback.mode),
    filter: readOption(stored.filter, FILTER_TYPES, fallback.filter),
    lfoWave: readOption(stored.lfoWave, WAVEFORMS, fallback.lfoWave),
    lfoTarget: readOption(stored.lfoTarget, LFO_TARGETS, fallback.lfoTarget),
  };
  for (const key of Object.keys(PATCH_RANGES) as PatchControl[]) {
    const field = stored[key];
    if (typeof field !== "number" || !Number.isFinite(field)) continue;
    const [min, max, step] = PATCH_RANGES[key];
    const bounded = Math.min(max, Math.max(min, field));
    const snapped = Math.round(bounded / step) * step;
    patch[key] = Number(snapped.toFixed(2));
  }
  return patch;
}
