import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPatches, loadSongs, savePatches, saveSongs } from "./lib/settings.ts";
import { CITY_PATCHES, INIT_PATCH, cutoffHz, readPatch } from "./synthPatch.ts";

afterEach(() => vi.unstubAllGlobals());

describe("synth patches", () => {
  it("recovers missing fields and validates loaded controls", () => {
    const fallback = CITY_PATCHES.tokyo;
    expect(readPatch({
      waveA: "square", waveB: "invalid", resonance: -10, fmRatio: 3.13,
      cutoff: 200, attack: Infinity, release: "100",
    }, fallback)).toEqual({
      ...fallback,
      waveA: "square",
      resonance: 0,
      fmRatio: 3.25,
      cutoff: 100,
    });
    expect(readPatch(null, fallback)).toEqual(fallback);
    expect(readPatch(null, fallback)).not.toBe(fallback);
  });

  it("keeps each city's patch separate from the existing song data", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });

    const songs = loadSongs();
    songs.amsterdam.notes[0] = 64;
    saveSongs(songs);

    const patches = loadPatches();
    patches.amsterdam = { ...INIT_PATCH, waveA: "triangle" };
    savePatches(patches);

    expect(loadPatches().amsterdam).toEqual(patches.amsterdam);
    expect(loadPatches().london).toEqual(CITY_PATCHES.london);
    expect(loadSongs()).toEqual(songs);
  });

  it("maps cutoff to a useful logarithmic frequency range", () => {
    expect(cutoffHz(0)).toBe(45);
    expect(cutoffHz(50)).toBeCloseTo(Math.sqrt(45 * 16000));
    expect(cutoffHz(100)).toBeCloseTo(16000);
  });
});
