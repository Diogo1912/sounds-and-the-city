import type { DrumId } from "../types.ts";

export type RegionId = "americas" | "alaska" | "california" | "hawaii" | "pacific" | "distant";

export function quakeRegion(lat: number, lon: number): RegionId {
  if (lat >= 50 && lon >= -170 && lon <= -130) return "alaska";
  if (lat >= 18 && lat <= 23 && lon >= -161 && lon <= -154) return "hawaii";
  if (lat >= 32 && lat <= 42.5 && lon >= -125 && lon <= -114) return "california";
  if (lon >= -130 && lon <= -60) return "americas";
  if (lon > -60 && lon < 100) return "distant";
  return "pacific";
}

export const REGION_META: { id: RegionId; name: string; drum: DrumId }[] = [
  { id: "americas", name: "Americas", drum: "kick" },
  { id: "alaska", name: "Alaska", drum: "snare" },
  { id: "california", name: "California", drum: "hat" },
  { id: "hawaii", name: "Hawaii", drum: "tom" },
  { id: "pacific", name: "Pacific", drum: "clap" },
  { id: "distant", name: "Distant", drum: "rim" },
];
