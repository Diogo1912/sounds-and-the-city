import type { DrumId, StepCount, Track } from "../types.ts";

export type ProjectedTrack = {
  track: Track;
  values: number[];
  details: string[];
};

export type StepHit = {
  drum: DrumId;
  velocity: number;
  muted: boolean;
};

/** Map a track onto 0–1 from its own quietest hour to its busiest. */
export function shapeHours(hours: number[]): number[] {
  if (hours.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const value of hours) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = max - min;
  if (!(span > 0)) return hours.map(() => 0);
  return hours.map((value) => (value - min) / span);
}

/** 24 = one step per hour. 96 = four equal steps sharing that hour's value. */
export function toSteps(shaped: number[], steps: StepCount): number[] {
  if (shaped.length !== 24) {
    throw new Error(`Expected 24 hours, got ${shaped.length}`);
  }
  if (steps === 24) return shaped.slice();
  const out: number[] = [];
  for (const value of shaped) out.push(value, value, value, value);
  return out;
}

export function projectTracks(tracks: Track[], steps: StepCount): ProjectedTrack[] {
  return tracks.map((track) => {
    const values = toSteps(shapeHours(track.hours), steps);
    const details =
      steps === 96 ? track.details.flatMap((detail) => [detail, detail, detail, detail]) : track.details.slice();
    return { track, values, details };
  });
}

export function buildPattern(rows: ProjectedTrack[], muted: ReadonlySet<string>): StepHit[][] {
  const count = rows[0]?.values.length ?? 0;
  const pattern: StepHit[][] = Array.from({ length: count }, () => []);
  for (const row of rows) {
    row.values.forEach((velocity, index) => {
      pattern[index]?.push({
        drum: row.track.drum,
        velocity,
        muted: muted.has(row.track.id),
      });
    });
  }
  return pattern;
}

export function stepClock(step: number, steps: number): { hour: number; minute: number } {
  const fraction = (step * 24) / steps;
  const hour = Math.floor(fraction) % 24;
  const minute = Math.round((fraction - Math.floor(fraction)) * 60) % 60;
  return { hour, minute };
}

export function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** One hour is one quarter note, at either resolution. */
export function secondsPerStep(bpm: number, steps: number): number {
  return 60 / bpm / (steps / 24);
}

export function dayLengthSeconds(bpm: number): number {
  return (24 * 60) / bpm;
}

export function periodName(hour: number): string {
  if (hour < 5) return "Night";
  if (hour < 10) return "Commute";
  if (hour < 16) return "Midday";
  if (hour < 20) return "Evening";
  return "Late";
}

/** Latest complete weekday (Mon–Fri) on or before a SODA timestamp. */
export function selectShowcaseDay(maxTimestamp: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2})/.exec(maxTimestamp);
  if (!match) throw new Error("Unexpected timestamp");
  const date = match[1];
  const hour = Number(match[2]);
  if (!date) throw new Error("Unexpected timestamp");
  const cursor = new Date(`${date}T12:00:00Z`);
  if (hour < 23) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return cursor.toISOString().slice(0, 10);
}

export function nextDate(day: string): string {
  const cursor = new Date(`${day}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  return cursor.toISOString().slice(0, 10);
}

export function formatDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Last calendar day whose 24 UTC hours have all finished.
 * `times` are `YYYY-MM-DDTHH:00` in UTC.
 */
export function pickCompleteDay(
  times: readonly string[],
  values: readonly (number | null)[],
  now: Date,
): { day: string; hours: number[] } | null {
  const byDay = new Map<string, number[]>();
  const count = Math.min(times.length, values.length);
  for (let index = 0; index < count; index += 1) {
    const time = times[index];
    const value = values[index];
    if (!time || value == null || !Number.isFinite(value)) continue;
    const day = time.slice(0, 10);
    const hour = Number(time.slice(11, 13));
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) continue;
    const start = Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00Z`);
    if (!Number.isFinite(start) || start + 60 * 60 * 1000 > now.getTime()) continue;
    let hours = byDay.get(day);
    if (!hours) {
      hours = Array.from({ length: 24 }, () => Number.NaN);
      byDay.set(day, hours);
    }
    hours[hour] = value;
  }
  const days = [...byDay.keys()].sort();
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (!day) continue;
    const hours = byDay.get(day);
    if (hours?.every((value) => Number.isFinite(value))) return { day, hours };
  }
  return null;
}

export function localClock(day: string, hour: number, minute: number, timeZone: string): string {
  const date = new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), hour, minute));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}
