import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPatch, loadSong, savePatch, saveSong } from "./lib/settings.ts";
import { AMSTERDAM_PATCH, INIT_PATCH, SYNTH_PRESETS, cutoffHz, readPatch } from "./synthPatch.ts";

afterEach(() => vi.unstubAllGlobals());

describe("synth patches", () => {
  it("recovers missing fields and validates loaded controls", () => {
    const fallback = AMSTERDAM_PATCH;
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

  it("imports the Amsterdam patch and keeps patch edits separate from the song", () => {
    const stored = { ...INIT_PATCH, waveA: "triangle" } as const;
    const storage = new Map([["city-rhythm-patches-v1", JSON.stringify({ amsterdam: stored })]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });

    const song = loadSong();
    song.notes[0] = 64;
    saveSong(song);
    expect(loadPatch()).toEqual(stored);

    const patch = { ...loadPatch(), cutoff: 72 };
    savePatch(patch);

    expect(loadPatch()).toEqual(patch);
    expect(loadSong()).toEqual(song);
  });

  it("ships distinct presets that fit the supported patch controls", () => {
    expect(new Set(SYNTH_PRESETS.map(({ id }) => id)).size).toBe(SYNTH_PRESETS.length);
    for (const { patch } of SYNTH_PRESETS) {
      expect(readPatch(patch, INIT_PATCH)).toEqual(patch);
    }
  });

  it("maps cutoff to a useful logarithmic frequency range", () => {
    expect(cutoffHz(0)).toBe(45);
    expect(cutoffHz(50)).toBeCloseTo(Math.sqrt(45 * 16000));
    expect(cutoffHz(100)).toBeCloseTo(16000);
  });
});
