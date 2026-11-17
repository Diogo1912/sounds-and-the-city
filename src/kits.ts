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

// Step numbers match the labels on the instrument.
const DEMO_HITS: Readonly<Record<string, readonly number[]>> = {
  tram: [4, 12],
  bell: [3, 7, 11, 15],
  cobbles: [1, 5, 9, 13],
  canal: [],
  carillon: [],
  bridge: [1, 9],
};
const DEMO_NOTES: Readonly<Record<number, number>> = { 2: 60, 6: 64, 8: 67, 10: 69, 14: 67, 16: 62 };

export function emptySong(): Song {
  return {
    drums: AMSTERDAM_VOICES.map(() => Array<number>(STEP_COUNT).fill(0)),
    notes: Array<number | null>(STEP_COUNT).fill(null),
  };
}

export function demoSong(): Song {
  return {
    drums: AMSTERDAM_VOICES.map(({ id }) =>
      Array.from({ length: STEP_COUNT }, (_, index) => DEMO_HITS[id]?.includes(index + 1) ? 0.9 : 0),
    ),
    notes: Array.from({ length: STEP_COUNT }, (_, index) => DEMO_NOTES[index + 1] ?? null),
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
