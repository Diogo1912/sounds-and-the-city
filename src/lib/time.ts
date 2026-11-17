export const STEP_COUNT = 16;
export const LEGACY_STEP_COUNT = 24;
export const STEPS_PER_BEAT = 4;

/** One step is a sixteenth note. BPM measures quarter notes. */
export function secondsPerStep(bpm: number): number {
  return 60 / bpm / STEPS_PER_BEAT;
}

export function formatStep(step: number): string {
  return String(step + 1).padStart(2, "0");
}

export function legacyStep(index: number): number {
  return Math.floor(index * STEP_COUNT / LEGACY_STEP_COUNT);
}
