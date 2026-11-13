import { isCityId, presetPatterns } from "../kits.ts";
import type { CityId } from "../types.ts";

const SETTINGS_KEY = "city-rhythm-v2";
const PATTERN_KEY = "city-rhythm-patterns-v2";

export type Settings = {
  cityId: CityId;
  bpm: number;
  volume: number;
};

export const DEFAULT_SETTINGS: Settings = {
  cityId: "new-york",
  bpm: 96,
  volume: 0.82,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_SETTINGS;
    const value = parsed as Partial<Settings>;
    return {
      cityId: isCityId(value.cityId) ? value.cityId : DEFAULT_SETTINGS.cityId,
      bpm: clamp(value.bpm, 60, 180, DEFAULT_SETTINGS.bpm),
      volume: clamp(value.volume, 0, 1, DEFAULT_SETTINGS.volume),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadPatterns(): Record<CityId, number[][]> {
  const presets = presetPatterns();
  try {
    const raw = localStorage.getItem(PATTERN_KEY);
    if (!raw) return presets;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return presets;
    const record = parsed as Partial<Record<CityId, number[][]>>;
    for (const id of Object.keys(presets) as CityId[]) {
      const rows = record[id];
      if (!isPattern(rows, presets[id].length)) continue;
      presets[id] = rows.map((row) => row.slice());
    }
    return presets;
  } catch {
    return presets;
  }
}

export function savePatterns(patterns: Record<CityId, number[][]>): void {
  localStorage.setItem(PATTERN_KEY, JSON.stringify(patterns));
}

function isPattern(value: unknown, voices: number): value is number[][] {
  if (!Array.isArray(value) || value.length !== voices) return false;
  return value.every((row) => Array.isArray(row) && row.length === 16 && row.every((cell) => typeof cell === "number"));
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
