import { afterEach, describe, expect, it, vi } from "vitest";
import { demoSong } from "../kits.ts";
import { loadSong, saveSong } from "./settings.ts";
import { secondsPerStep, STEP_COUNT } from "./time.ts";

afterEach(() => vi.unstubAllGlobals());

describe("16-step patterns", () => {
  it("maps old steps across the bar and keeps the strongest drum hit on a collision", () => {
    const legacy = {
      drums: Array.from({ length: 6 }, () => Array<number>(24).fill(0)),
      notes: Array<number | null>(24).fill(null),
    };
    legacy.drums[0]![0] = 0.4;
    legacy.drums[0]![1] = 0.9;
    legacy.drums[5]![23] = 1;
    legacy.notes[0] = 60;
    legacy.notes[1] = 62;
    legacy.notes[22] = 65;
    const key = "city-rhythm-songs-v4";
    const original = JSON.stringify({ amsterdam: legacy });
    const storage = new Map([[key, original]]);
    vi.stubGlobal("localStorage", {
      getItem: (name: string) => storage.get(name) ?? null,
      setItem: (name: string, value: string) => storage.set(name, value),
    });

    const song = loadSong();
    const { drums, notes } = song;
    expect(drums.every((row) => row.length === STEP_COUNT)).toBe(true);
    expect(drums[0]?.[0]).toBe(0.9);
    expect(drums[5]?.[15]).toBe(1);
    expect(notes).toHaveLength(STEP_COUNT);
    expect(notes[0]).toBe(60);
    expect(notes[14]).toBe(65);
    saveSong(song);
    expect(loadSong()).toEqual(song);
    expect(storage.get(key)).toBe(original);
  });

  it("plays a four-beat bar and starts Demo on the same 16-step grid", () => {
    expect(STEP_COUNT * secondsPerStep(120)).toBe(2);
    const song = demoSong();
    expect(song.notes).toHaveLength(STEP_COUNT);
    expect(song.drums.every((row) => row.length === STEP_COUNT)).toBe(true);
  });
});
