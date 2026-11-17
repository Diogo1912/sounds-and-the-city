import { AMSTERDAM_VOICES, demoSong, emptySong } from "../kits.ts";
import { AMSTERDAM_PATCH, WARM_BASS_PATCH, readPatch } from "../synthPatch.ts";
import type { SynthPatch } from "../synthPatch.ts";
import type { Song } from "../types.ts";
import { LEGACY_STEP_COUNT, STEP_COUNT, legacyStep } from "./time.ts";

const SETTINGS_KEY = "city-rhythm-amsterdam-settings-v1";
const SONG_KEY = "city-rhythm-amsterdam-song-v1";
const PATCH_KEY = "city-rhythm-amsterdam-patch-v1";

export type Settings = { bpm: number; volume: number };
export const DEFAULT_SETTINGS: Settings = { bpm: 108, volume: 0.82 };

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Controls remain usable when storage is disabled or full.
  }
}

function field(value: unknown, key: string): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function loadSettings(): Settings {
  const saved = read(SETTINGS_KEY);
  const legacy = read("city-rhythm-v4");
  const stored = saved ?? legacy;
  const bpm = saved || field(legacy, "cityId") === "amsterdam" ? field(stored, "bpm") : undefined;
  return {
    bpm: clamp(bpm, 60, 180, DEFAULT_SETTINGS.bpm),
    volume: clamp(field(stored, "volume"), 0, 1, DEFAULT_SETTINGS.volume),
  };
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings);
}

export function loadSong(): Song {
  const saved = read(SONG_KEY);
  if (isSong(saved, STEP_COUNT)) return saved;
  const previous = field(read("city-rhythm-songs-v5"), "amsterdam");
  if (isSong(previous, STEP_COUNT)) return previous;
  const legacy = field(read("city-rhythm-songs-v4"), "amsterdam");
  if (!isSong(legacy, LEGACY_STEP_COUNT)) return demoSong();
  const song = emptySong();
  legacy.drums.forEach((row, voice) => {
    row.forEach((velocity, index) => {
      const step = legacyStep(index);
      song.drums[voice]![step] = Math.max(song.drums[voice]![step] ?? 0, velocity);
    });
  });
  legacy.notes.forEach((note, index) => {
    if (note !== null) song.notes[legacyStep(index)] ??= note;
  });
  return song;
}

export function saveSong(song: Song): void {
  write(SONG_KEY, song);
}

function isSong(value: unknown, steps: number): value is Song {
  if (!value || typeof value !== "object") return false;
  const { notes, drums } = value as Song;
  return Array.isArray(notes) && notes.length === steps
    && notes.every((note) => note === null || (Number.isInteger(note) && note >= 0 && note <= 127))
    && Array.isArray(drums) && drums.length === AMSTERDAM_VOICES.length
    && drums.every((row) => Array.isArray(row) && row.length === steps && row.every(Number.isFinite));
}

export function loadPatch(): SynthPatch {
  const saved = read(PATCH_KEY) ?? field(read("city-rhythm-patches-v1"), "amsterdam");
  if (!saved || typeof saved !== "object") return { ...WARM_BASS_PATCH };
  return readPatch(saved, AMSTERDAM_PATCH);
}

export function savePatch(patch: SynthPatch): void {
  write(PATCH_KEY, patch);
}
