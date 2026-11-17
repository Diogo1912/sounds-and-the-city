import { describe, expect, it } from "vitest";
import { AMSTERDAM_VOICES, demoSong, emptySong, writeCell } from "../kits.ts";
import { STEP_COUNT } from "./time.ts";

describe("Amsterdam kit", () => {
  it("gives each unique track a 16-step velocity row and includes a synth sequence", () => {
    const { drums, notes } = demoSong();
    expect(new Set(AMSTERDAM_VOICES.map((voice) => voice.id)).size).toBe(6);
    expect(drums).toHaveLength(AMSTERDAM_VOICES.length);
    for (const row of drums) {
      expect(row).toHaveLength(STEP_COUNT);
      expect(row.some((value) => value > 0)).toBe(true);
      for (const velocity of row) {
        expect(velocity).toBeGreaterThanOrEqual(0);
        expect(velocity).toBeLessThanOrEqual(1);
      }
    }
    expect(notes).toHaveLength(STEP_COUNT);
    expect(notes.some((note) => note !== null)).toBe(true);
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
