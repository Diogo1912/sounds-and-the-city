/** One step is one hour, played as one quarter note. */
export function secondsPerStep(bpm: number): number {
  return 60 / bpm;
}

export function formatHour(step: number): string {
  return String(step).padStart(2, "0");
}
