const LATE_TOLERANCE = 0.014;

/** Leave the transport on its audio-clock grid when a scheduler tick arrives late. */
export function missedSteps(nextTime: number, now: number, duration: number): number {
  return Math.max(0, Math.ceil((now - nextTime - LATE_TOLERANCE) / duration));
}
