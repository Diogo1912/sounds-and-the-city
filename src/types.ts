export type CityId = "new-york" | "amsterdam" | "tokyo" | "london";

export type Voice = {
  id: string;
  name: string;
};

export type CityKit = {
  id: CityId;
  label: string;
  bpm: number;
  voices: Voice[];
  /** Velocity per voice for the 16 steps. */
  pattern: number[][];
};

export type StepHit = {
  voice: string;
  velocity: number;
  muted: boolean;
  note?: number;
};

export type Song = {
  drums: number[][];
  notes: (number | null)[];
};

export type SynthSpec = {
  name: string;
  scale: number[];
};
