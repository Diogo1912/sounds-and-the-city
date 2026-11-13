export type CityId = "new-york" | "amsterdam" | "tokyo" | "london";

export type Voice = {
  id: string;
  name: string;
  hint: string;
};

export type CityKit = {
  id: CityId;
  label: string;
  bpm: number;
  note: string;
  voices: Voice[];
  /** velocity per voice per step. 16 steps, one bar of sixteenth notes. */
  pattern: number[][];
};

export type StepHit = {
  voice: string;
  velocity: number;
  muted: boolean;
};
