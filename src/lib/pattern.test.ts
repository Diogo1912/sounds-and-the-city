import { describe, expect, it } from "vitest";
import { CITIES, DEMO_NOTES, clonePattern, emptySong, writeCell } from "../kits.ts";
import { secondsPerStep } from "./time.ts";

describe("city kits", () => {
  it("ships four places, each a 24-hour pattern", () => {
    expect(CITIES.map((city) => city.id)).toEqual(["new-york", "amsterdam", "tokyo", "london"]);
    for (const city of CITIES) {
      expect(city.voices).toHaveLength(6);
      expect(city.pattern).toHaveLength(6);
      for (const row of city.pattern) {
        expect(row).toHaveLength(24);
        for (const velocity of row) {
          expect(velocity).toBeGreaterThanOrEqual(0);
          expect(velocity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("starts empty and keeps a 24-hour demo", () => {
    const blank = emptySong();
    expect(blank.drums.every((row) => row.every((value) => value === 0))).toBe(true);
    expect(blank.notes.every((note) => note === null)).toBe(true);
    for (const city of CITIES) expect(DEMO_NOTES[city.id]).toHaveLength(24);
  });

  it("writes one hour without changing the preset", () => {
    const preset = CITIES[0]!.pattern;
    const before = preset[1]![8];
    const edited = writeCell(preset, 1, 8, before > 0 ? 0 : 0.9);
    expect(edited[1]![8]).not.toBe(before);
    expect(preset[1]![8]).toBe(before);
    expect(clonePattern(preset)[1]![8]).toBe(before);
  });
});

describe("tempo", () => {
  it("plays one hour as one beat", () => {
    expect(secondsPerStep(120)).toBeCloseTo(0.5);
    expect(24 * secondsPerStep(96)).toBeCloseTo(15);
  });
});
