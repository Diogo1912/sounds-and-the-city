import { LEGACY_STEP_COUNT, STEP_COUNT, legacyStep } from "./time.ts";
import { emptySongs, isCityId } from "../kits.ts";
import { CITY_PATCHES, readPatch } from "../synthPatch.ts";
import type { SynthPatch } from "../synthPatch.ts";
import type { CityId, Song } from "../types.ts";

const SETTINGS_KEY = "city-rhythm-v4";
const SONG_KEY = "city-rhythm-songs-v5";
const LEGACY_SONG_KEY = "city-rhythm-songs-v4";
const PATCH_KEY = "city-rhythm-patches-v1";

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

export function loadSongs(): Record<CityId, Song> {
  const songs = emptySongs();
  try {
    const raw = localStorage.getItem(SONG_KEY) ?? localStorage.getItem(LEGACY_SONG_KEY);
    if (!raw) return songs;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return songs;
    const record = parsed as Partial<Record<CityId, Song>>;
    for (const id of Object.keys(songs) as CityId[]) {
      const song = record[id];
      if (!isSong(song)) continue;
      if (song.notes.length === STEP_COUNT) {
        songs[id] = { drums: song.drums.map((row) => row.slice()), notes: song.notes.slice() };
      } else {
        const next = songs[id];
        song.drums.forEach((row, voice) => {
          row.forEach((velocity, index) => {
            const step = legacyStep(index);
            next.drums[voice]![step] = Math.max(next.drums[voice]![step] ?? 0, velocity);
          });
        });
        song.notes.forEach((note, index) => {
          if (note !== null) next.notes[legacyStep(index)] ??= note;
        });
      }
    }
    return songs;
  } catch {
    return songs;
  }
}

export function saveSongs(songs: Record<CityId, Song>): void {
  localStorage.setItem(SONG_KEY, JSON.stringify(songs));
}

function isSong(value: unknown): value is Song {
  if (!value || typeof value !== "object") return false;
  const song = value as Song;
  if (!Array.isArray(song.notes)) return false;
  const stepCount = song.notes.length;
  if (stepCount !== STEP_COUNT && stepCount !== LEGACY_STEP_COUNT) return false;
  if (!Array.isArray(song.drums) || song.drums.length !== 6) return false;
  if (!song.drums.every((row) => Array.isArray(row) && row.length === stepCount && row.every((cell) => typeof cell === "number" && Number.isFinite(cell)))) {
    return false;
  }
  return song.notes.every((note) => note === null || (Number.isInteger(note) && note >= 0 && note <= 127));
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function loadPatches(): Record<CityId, SynthPatch> {
  let stored: unknown;
  try {
    stored = JSON.parse(localStorage.getItem(PATCH_KEY) ?? "null");
  } catch {
    stored = null;
  }
  const record = stored && typeof stored === "object" ? stored as Partial<Record<CityId, unknown>> : {};
  return {
    "new-york": readPatch(record["new-york"], CITY_PATCHES["new-york"]),
    amsterdam: readPatch(record.amsterdam, CITY_PATCHES.amsterdam),
    tokyo: readPatch(record.tokyo, CITY_PATCHES.tokyo),
    london: readPatch(record.london, CITY_PATCHES.london),
  };
}

export function savePatches(patches: Record<CityId, SynthPatch>): void {
  try {
    localStorage.setItem(PATCH_KEY, JSON.stringify(patches));
  } catch {
    // Private browsing and full storage can still leave patches usable for this session.
  }
}
