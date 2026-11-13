import { emptySongs, isCityId } from "../kits.ts";
import type { CityId, Song } from "../types.ts";

const SETTINGS_KEY = "city-rhythm-v4";
const SONG_KEY = "city-rhythm-songs-v4";

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
    const raw = localStorage.getItem(SONG_KEY);
    if (!raw) return songs;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return songs;
    const record = parsed as Partial<Record<CityId, Song>>;
    for (const id of Object.keys(songs) as CityId[]) {
      const song = record[id];
      if (!isSong(song)) continue;
      songs[id] = {
        drums: song.drums.map((row) => row.slice()),
        notes: song.notes.slice(),
      };
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
  if (!Array.isArray(song.drums) || song.drums.length !== 6) return false;
  if (!song.drums.every((row) => Array.isArray(row) && row.length === 24 && row.every((cell) => typeof cell === "number"))) {
    return false;
  }
  return Array.isArray(song.notes) && song.notes.length === 24 && song.notes.every((note) => note === null || typeof note === "number");
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
