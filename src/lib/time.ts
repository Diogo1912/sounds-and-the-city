/** One step is a sixteenth note. A bar is 16 steps. */
export function secondsPerStep(bpm: number): number {
  return 60 / bpm / 4;
}

export function barSeconds(bpm: number): number {
  return (4 * 60) / bpm;
}

export function formatStep(step: number): string {
  return String(step + 1).padStart(2, "0");
}
