import { STEP_COUNT } from "./lib/time.ts";
import type { Song, Voice } from "./types.ts";

export const AMSTERDAM_VOICES: Voice[] = [
  { id: "tram", name: "Tram" },
  { id: "bell", name: "Bike bell" },
  { id: "cobbles", name: "Cobbles" },
  { id: "canal", name: "Canal" },
  { id: "carillon", name: "Carillon" },
  { id: "bridge", name: "Bridge" },
];

const DEMO_DRUMS: ReadonlyArray<Readonly<Record<number, number>>> = [
  { 0: 0.95, 4: 0.75, 8: 0.92, 12: 0.85 },
  { 2: 0.75, 6: 0.85, 10: 0.82, 14: 0.9 },
  { 3: 0.55, 7: 0.72, 11: 0.65, 13: 0.66, 15: 0.8 },
  { 0: 0.52, 8: 0.72, 14: 0.5 },
  { 4: 0.58, 12: 0.68 },
  { 8: 0.7 },
];
const DEMO_NOTES: Readonly<Record<number, number>> = { 0: 60, 3: 64, 6: 67, 8: 60, 10: 69, 12: 67, 15: 62 };

export function emptySong(): Song {
  return {
    drums: AMSTERDAM_VOICES.map(() => Array<number>(STEP_COUNT).fill(0)),
    notes: Array<number | null>(STEP_COUNT).fill(null),
  };
}

export function demoSong(): Song {
  return {
    drums: DEMO_DRUMS.map((row) => Array.from({ length: STEP_COUNT }, (_, index) => row[index] ?? 0)),
    notes: Array.from({ length: STEP_COUNT }, (_, index) => DEMO_NOTES[index] ?? null),
  };
}

export function writeCell(pattern: number[][], voice: number, step: number, velocity: number): number[][] {
  const row = pattern[voice];
  if (!row || step < 0 || step >= row.length) return pattern;
  const next = pattern.slice();
  next[voice] = row.slice();
  next[voice]![step] = velocity;
  return next;
}
