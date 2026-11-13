import type { CityId, CityKit } from "./types.ts";

const HOURS = 24;

function row(hits: Record<number, number>): number[] {
  const hours = Array.from({ length: HOURS }, () => 0);
  for (const [hour, velocity] of Object.entries(hits)) hours[Number(hour)] = velocity;
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
      row({ 5: 0.45, 6: 0.7, 7: 1, 8: 1, 9: 0.85, 12: 0.5, 16: 0.75, 17: 1, 18: 1, 19: 0.8, 22: 0.45, 23: 0.35 }),
      row({ 8: 0.75, 9: 0.9, 12: 0.6, 16: 0.8, 17: 1, 18: 0.95, 19: 0.7, 21: 0.5, 22: 0.45 }),
      row({ 7: 0.85, 8: 1, 9: 0.9, 17: 0.8, 18: 0.95 }),
      row({ 0: 0.55, 1: 0.75, 2: 0.5, 5: 0.6, 22: 0.5, 23: 0.7 }),
      row({ 7: 0.65, 8: 0.9, 9: 0.7, 17: 0.75, 18: 0.9 }),
      row({ 8: 0.7, 9: 0.95, 10: 1, 11: 0.85, 13: 0.8, 14: 0.95, 15: 0.7 }),
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
      row({ 7: 0.8, 8: 1, 9: 0.85, 12: 0.55, 16: 0.7, 17: 0.95, 18: 0.8 }),
      row({ 7: 0.75, 8: 1, 9: 0.95, 12: 0.5, 16: 0.75, 17: 1, 18: 0.8 }),
      row({ 8: 0.55, 9: 0.5, 17: 0.55, 18: 0.45 }),
      row({ 6: 0.4, 21: 0.55, 22: 0.7, 23: 0.4 }),
      row({ 9: 0.8, 12: 1, 18: 0.85 }),
      row({ 8: 0.75, 17: 0.85 }),
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
      row({ 6: 0.5, 7: 0.9, 8: 1, 9: 0.85, 17: 0.85, 18: 1, 19: 0.75, 23: 0.55 }),
      row({ 8: 0.85, 9: 0.7, 12: 0.75, 13: 0.6, 17: 0.7, 18: 0.9 }),
      row({ 7: 0.75, 8: 1, 9: 0.85, 17: 0.7, 18: 0.95, 19: 0.7 }),
      row({ 7: 0.55, 8: 0.75, 18: 0.7 }),
      row({ 7: 0.6, 8: 0.85, 18: 0.8, 19: 0.6 }),
      row({ 6: 0.9, 18: 0.75 }),
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
      row({ 8: 0.85, 12: 1, 18: 0.9 }),
      row({ 7: 0.7, 8: 1, 9: 0.8, 17: 0.75, 18: 0.95, 23: 0.5 }),
      row({ 8: 0.5, 18: 0.7, 19: 0.9, 20: 0.75, 22: 0.8, 23: 0.6 }),
      row({ 7: 0.75, 8: 0.95, 9: 0.7, 16: 0.65, 17: 0.9 }),
      row({ 3: 0.4, 7: 0.45, 11: 0.5, 14: 0.45, 19: 0.55, 22: 0.4 }),
      row({ 7: 0.7, 8: 0.85, 17: 0.75, 18: 0.8 }),
    ],
  },
];

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
