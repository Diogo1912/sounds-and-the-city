export type Voice = {
  id: string;
  name: string;
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
