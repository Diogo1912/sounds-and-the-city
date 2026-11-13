/** One step is one hour, played as one quarter note. */
export function secondsPerStep(bpm: number): number {
  return 60 / bpm;
}

export function formatHour(step: number): string {
  return String(step).padStart(2, "0");
}

export function dayPhase(hour: number): "night" | "dawn" | "day" | "dusk" {
  if (hour < 5 || hour >= 21) return "night";
  if (hour < 8) return "dawn";
  if (hour < 17) return "day";
  return "dusk";
}
