import type { CityId, CityKit, Song, SynthSpec } from "./types.ts";

import { STEP_COUNT, legacyStep } from "./lib/time.ts";

function row(hits: Record<number, number>): number[] {
  const hours = Array.from({ length: STEP_COUNT }, () => 0);
  for (const [hour, velocity] of Object.entries(hits)) {
    const index = legacyStep(Number(hour));
    hours[index] = Math.max(hours[index] ?? 0, velocity);
  }
  return hours;
}

export const CITIES: CityKit[] = [
  {
    id: "new-york",
    label: "New York",
    bpm: 96,
    voices: [
      { id: "subway", name: "Subway" },
      { id: "horn", name: "Taxi" },
      { id: "turnstile", name: "Turnstile" },
      { id: "steam", name: "Radiator" },
      { id: "chime", name: "Chime" },
      { id: "hammer", name: "Jackhammer" },
    ],
    pattern: [
      row({ 6: 0.8, 8: 1, 10: 0.75, 14: 0.7, 16: 0.85, 18: 1 }),
      row({ 8: 0.9, 17: 1 }),
      row({ 7: 0.85, 9: 0.7, 15: 0.8, 19: 0.75 }),
      row({ 0: 0.6, 1: 0.45, 23: 0.55 }),
      row({ 8: 0.8, 12: 0.9, 18: 0.75 }),
      row({ 10: 0.7, 11: 0.9, 13: 0.8, 14: 0.65 }),
    ],
  },
  {
    id: "amsterdam",
    label: "Amsterdam",
    bpm: 108,
    voices: [
      { id: "tram", name: "Tram" },
      { id: "bell", name: "Bike bell" },
      { id: "cobbles", name: "Cobbles" },
      { id: "canal", name: "Canal" },
      { id: "carillon", name: "Carillon" },
      { id: "bridge", name: "Bridge" },
    ],
    pattern: [
      row({ 8: 0.9, 12: 0.7, 16: 0.75, 18: 0.85 }),
      row({ 7: 0.8, 9: 0.7, 15: 0.75, 17: 0.9 }),
      row({ 8: 0.6, 9: 0.5, 17: 0.65, 18: 0.5 }),
      row({ 21: 0.7, 22: 0.85, 23: 0.55 }),
      row({ 12: 0.9, 18: 0.7 }),
      row({ 8: 0.8, 17: 0.75 }),
    ],
  },
  {
    id: "tokyo",
    label: "Tokyo",
    bpm: 118,
    voices: [
      { id: "train", name: "Train" },
      { id: "crossing", name: "Crossing" },
      { id: "gate", name: "Gate" },
      { id: "rail", name: "Rail" },
      { id: "door", name: "Door" },
      { id: "bowl", name: "Bowl" },
    ],
    pattern: [
      row({ 8: 0.95, 18: 0.85 }),
      row({ 7: 0.8, 17: 0.75 }),
      row({ 8: 0.9, 9: 0.7, 18: 0.85 }),
      row({ 6: 0.7, 8: 0.85, 16: 0.65, 18: 0.8 }),
      row({ 7: 0.75, 19: 0.7 }),
      row({ 12: 0.8, 21: 0.65 }),
    ],
  },
  {
    id: "london",
    label: "London",
    bpm: 92,
    voices: [
      { id: "bell", name: "Bell" },
      { id: "tube", name: "Tube" },
      { id: "cab", name: "Cab" },
      { id: "bus", name: "Bus bell" },
      { id: "rain", name: "Rain" },
      { id: "diesel", name: "Diesel" },
    ],
    pattern: [
      row({ 12: 1 }),
      row({ 8: 0.75, 17: 0.7 }),
      row({ 9: 0.85, 18: 0.8, 22: 0.65 }),
      row({ 8: 0.9, 16: 0.75 }),
      row({ 6: 0.55, 7: 0.5, 19: 0.6, 22: 0.5 }),
      row({ 8: 0.7, 10: 0.55, 18: 0.65 }),
    ],
  },
];

function notes(hits: Record<number, number>): (number | null)[] {
  const row: (number | null)[] = Array.from({ length: STEP_COUNT }, () => null);
  for (const [hour, midi] of Object.entries(hits)) {
    const index = legacyStep(Number(hour));
    row[index] ??= midi;
  }
  return row;
}

export const SYNTH: Record<CityId, SynthSpec> = {
  "new-york": { name: "Bass", scale: [45, 48, 50, 52, 55, 57, 60, 62] },
  amsterdam: { name: "Pluck", scale: [60, 62, 64, 67, 69, 72, 74, 76] },
  tokyo: { name: "FM", scale: [62, 65, 67, 69, 72, 74, 77, 79] },
  london: { name: "Organ", scale: [52, 55, 57, 59, 62, 64, 67, 69] },
};

export const DEMO_NOTES: Record<CityId, (number | null)[]> = {
  "new-york": notes({ 0: 45, 4: 45, 8: 45, 10: 48, 12: 45, 14: 52, 16: 45, 18: 50, 20: 48, 22: 45 }),
  amsterdam: notes({ 8: 60, 10: 64, 12: 67, 14: 64, 16: 60, 18: 62, 20: 57, 22: 67 }),
  tokyo: notes({ 8: 62, 10: 65, 12: 69, 16: 62, 18: 67, 20: 69, 23: 62 }),
  london: notes({ 8: 52, 10: 55, 12: 59, 16: 52, 18: 50, 20: 55, 22: 52 }),
};

export function emptySong(): Song {
  return {
    drums: Array.from({ length: 6 }, () => Array.from({ length: STEP_COUNT }, () => 0)),
    notes: Array.from({ length: STEP_COUNT }, () => null),
  };
}

export function emptySongs(): Record<CityId, Song> {
  return {
    "new-york": emptySong(),
    amsterdam: emptySong(),
    tokyo: emptySong(),
    london: emptySong(),
  };
}

export function demoSong(city: CityKit): Song {
  return { drums: clonePattern(city.pattern), notes: (DEMO_NOTES[city.id] ?? emptySong().notes).slice() };
}

export function cityById(id: CityId): CityKit {
  const city = CITIES.find((item) => item.id === id);
  if (!city) throw new Error(`Unknown city ${id}`);
  return city;
}

export function isCityId(value: unknown): value is CityId {
  return value === "new-york" || value === "amsterdam" || value === "tokyo" || value === "london";
}

export function clonePattern(pattern: number[][]): number[][] {
  return pattern.map((row) => row.slice());
}

export function writeCell(pattern: number[][], voice: number, step: number, velocity: number): number[][] {
  const next = clonePattern(pattern);
  const line = next[voice];
  if (!line || step < 0 || step >= line.length) return next;
  line[step] = velocity;
  return next;
}

export function presetPatterns(): Record<CityId, number[][]> {
  return {
    "new-york": clonePattern(cityById("new-york").pattern),
    amsterdam: clonePattern(cityById("amsterdam").pattern),
    tokyo: clonePattern(cityById("tokyo").pattern),
    london: clonePattern(cityById("london").pattern),
  };
}
