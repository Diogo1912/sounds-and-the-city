import { describe, expect, it } from "vitest";
import { CITIES, clonePattern, writeCell } from "../kits.ts";
import { barSeconds, secondsPerStep } from "./time.ts";

describe("city kits", () => {
  it("ships four places, each a 16-step bar", () => {
    expect(CITIES.map((city) => city.id)).toEqual(["new-york", "amsterdam", "tokyo", "london"]);
    for (const city of CITIES) {
      expect(city.voices).toHaveLength(6);
      expect(city.pattern).toHaveLength(6);
      for (const row of city.pattern) {
        expect(row).toHaveLength(16);
        for (const velocity of row) {
          expect(velocity).toBeGreaterThanOrEqual(0);
          expect(velocity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("writes one pad without changing the preset", () => {
    const preset = CITIES[0]!.pattern;
    const before = preset[1]![0];
    const edited = writeCell(preset, 1, 0, before > 0 ? 0 : 0.9);
    expect(edited[1]![0]).not.toBe(before);
    expect(preset[1]![0]).toBe(before);
    expect(clonePattern(preset)[1]![0]).toBe(before);
  });
});

describe("tempo", () => {
  it("treats a bar as four quarter notes", () => {
    expect(secondsPerStep(120)).toBeCloseTo(0.125);
    expect(barSeconds(120)).toBeCloseTo(2);
    expect(barSeconds(120)).toBeCloseTo(16 * secondsPerStep(120));
  });
});
