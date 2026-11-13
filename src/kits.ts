import type { CityId, CityKit } from "./types.ts";

const STEPS = 16;

function row(hits: Record<number, number>): number[] {
  const steps = Array.from({ length: STEPS }, () => 0);
  for (const [step, velocity] of Object.entries(hits)) steps[Number(step)] = velocity;
  return steps;
}

export const CITIES: CityKit[] = [
  {
    id: "new-york",
    label: "New York",
    bpm: 96,
    note: "Subway joint, taxi horn, turnstile, radiator, door chime, jackhammer.",
    voices: [
      { id: "subway", name: "Subway", hint: "Joint" },
      { id: "horn", name: "Horn", hint: "Taxi" },
      { id: "turnstile", name: "Turnstile", hint: "Click" },
      { id: "steam", name: "Steam", hint: "Radiator" },
      { id: "chime", name: "Chime", hint: "Door" },
      { id: "hammer", name: "Hammer", hint: "Street" },
    ],
    pattern: [
      row({ 0: 1, 8: 1 }),
      row({ 3: 0.95, 7: 0.9, 11: 0.95 }),
      row({ 4: 0.85, 12: 0.8 }),
      row({ 2: 0.45, 6: 0.4, 10: 0.45, 14: 0.4 }),
      row({ 8: 0.75 }),
      row({ 14: 0.85, 15: 0.95 }),
    ],
  },
  {
    id: "amsterdam",
    label: "Amsterdam",
    bpm: 112,
    note: "Tram gong, bike bell, cobbles, canal, carillon, bridge horn.",
    voices: [
      { id: "tram", name: "Tram", hint: "Gong" },
      { id: "bell", name: "Bell", hint: "Bike" },
      { id: "cobbles", name: "Cobbles", hint: "Tire" },
      { id: "canal", name: "Canal", hint: "Slap" },
      { id: "carillon", name: "Carillon", hint: "Tower" },
      { id: "bridge", name: "Bridge", hint: "Horn" },
    ],
    pattern: [
      row({ 0: 1, 8: 0.9 }),
      row({ 2: 0.85, 6: 0.7, 10: 0.85, 14: 0.7 }),
      row({ 1: 0.4, 5: 0.35, 9: 0.4, 13: 0.35 }),
      row({ 7: 0.7, 15: 0.65 }),
      row({ 12: 0.9 }),
      row({ 4: 0.8 }),
    ],
  },
  {
    id: "tokyo",
    label: "Tokyo",
    bpm: 120,
    note: "Train, crossing signal, ticket gate, rail joint, door, temple bowl.",
    voices: [
      { id: "train", name: "Train", hint: "Car" },
      { id: "crossing", name: "Crossing", hint: "Signal" },
      { id: "gate", name: "Gate", hint: "Ticket" },
      { id: "rail", name: "Rail", hint: "Clack" },
      { id: "door", name: "Door", hint: "Chime" },
      { id: "bowl", name: "Bowl", hint: "Temple" },
    ],
    pattern: [
      row({ 0: 1, 8: 0.95 }),
      row({ 4: 0.8, 12: 0.8 }),
      row({ 2: 0.7, 6: 0.65, 10: 0.7, 14: 0.65 }),
      row({ 0: 0.55, 8: 0.55 }),
      row({ 8: 0.75 }),
      row({ 15: 0.85 }),
    ],
  },
  {
    id: "london",
    label: "London",
    bpm: 92,
    note: "Clock bell, tube doors, cab horn, bus bell, rain, diesel.",
    voices: [
      { id: "bell", name: "Bell", hint: "Clock" },
      { id: "tube", name: "Tube", hint: "Door" },
      { id: "cab", name: "Cab", hint: "Horn" },
      { id: "bus", name: "Bus", hint: "Ding" },
      { id: "rain", name: "Rain", hint: "Drop" },
      { id: "diesel", name: "Diesel", hint: "Bus" },
    ],
    pattern: [
      row({ 0: 1 }),
      row({ 8: 0.75, 10: 0.7 }),
      row({ 4: 0.85, 12: 0.8 }),
      row({ 6: 0.8, 14: 0.75 }),
      row({ 1: 0.4, 3: 0.35, 5: 0.4, 7: 0.35, 9: 0.4, 11: 0.35, 13: 0.4, 15: 0.35 }),
      row({ 0: 0.65, 8: 0.7 }),
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
  const row = next[voice];
  if (!row || step < 0 || step >= row.length) return next;
  row[step] = velocity;
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
