import { isDatasetId } from "../data/catalog.ts";
import type { DatasetId, StepCount } from "../types.ts";

const KEY = "city-rhythm-settings";

export type Settings = {
  datasetId: DatasetId;
  bpm: number;
  steps: StepCount;
  gate: number;
  volume: number;
};

export const DEFAULT_SETTINGS: Settings = {
  datasetId: "nyc-subway",
  bpm: 104,
  steps: 24,
  gate: 0.4,
  volume: 0.82,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_SETTINGS;
    const value = parsed as Partial<Settings>;
    return {
      datasetId: isDatasetId(value.datasetId) ? value.datasetId : DEFAULT_SETTINGS.datasetId,
      bpm: clamp(value.bpm, 70, 160, DEFAULT_SETTINGS.bpm),
      steps: value.steps === 96 ? 96 : 24,
      gate: clamp(value.gate, 0.08, 0.85, DEFAULT_SETTINGS.gate),
      volume: clamp(value.volume, 0, 1, DEFAULT_SETTINGS.volume),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
