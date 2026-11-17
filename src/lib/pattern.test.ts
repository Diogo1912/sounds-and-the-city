import { describe, expect, it } from "vitest";
import { AMSTERDAM_VOICES, demoSong, emptySong, writeCell } from "../kits.ts";
import { STEP_COUNT } from "./time.ts";

describe("Amsterdam kit", () => {
  it("matches the Amsterdam starter groove and melody", () => {
    const { drums, notes } = demoSong();
    expect(new Set(AMSTERDAM_VOICES.map((voice) => voice.id)).size).toBe(6);
    expect(drums).toHaveLength(AMSTERDAM_VOICES.length);
    for (const row of drums) {
      expect(row).toHaveLength(STEP_COUNT);
      for (const velocity of row) {
        expect(velocity).toBeGreaterThanOrEqual(0);
        expect(velocity).toBeLessThanOrEqual(1);
      }
    }
    const hitsByVoice = Object.fromEntries(AMSTERDAM_VOICES.map(({ id }, row) => [
      id,
      drums[row]!.flatMap((velocity, index) => velocity > 0 ? [index + 1] : []),
    ]));
    expect(hitsByVoice).toEqual({
      tram: [4, 12],
      bell: [3, 7, 11, 15],
      cobbles: [1, 5, 9, 13],
      canal: [],
      carillon: [],
      bridge: [1, 9],
    });
    expect(notes).toHaveLength(STEP_COUNT);
    expect(notes.flatMap((note, index) => note === null ? [] : [[index + 1, note]])).toEqual([
      [1, 60], [3, 64], [5, 67], [7, 64], [9, 60], [11, 62], [13, 65], [14, 64],
    ]);
  });

  it("can clear the entire bar", () => {
    const blank = emptySong();
    expect(blank.drums.every((row) => row.every((value) => value === 0))).toBe(true);
    expect(blank.notes.every((note) => note === null)).toBe(true);
  });

  it("edits a drum step without mutating the source pattern", () => {
    const pattern = demoSong().drums;
    const before = pattern[1]![8];
    const velocity = before > 0 ? 0 : 0.9;
    const edited = writeCell(pattern, 1, 8, velocity);
    expect(edited[1]![8]).toBe(velocity);
    expect(pattern[1]![8]).toBe(before);
    expect(edited[0]).toBe(pattern[0]);
  });
});
