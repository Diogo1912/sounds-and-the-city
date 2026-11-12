import { describe, expect, it } from "vitest";
import { quakeRegion } from "../data/regions.ts";
import {
  dayLengthSeconds,
  pickCompleteDay,
  projectTracks,
  secondsPerStep,
  selectShowcaseDay,
  shapeHours,
  toSteps,
} from "./rhythm.ts";
import type { Track } from "../types.ts";

describe("shapeHours", () => {
  it("scales a track to its own range", () => {
    expect(shapeHours([1, 5, 9])).toEqual([0, 0.5, 1]);
  });

  it("stays silent when the day is flat", () => {
    expect(shapeHours([4, 4, 4])).toEqual([0, 0, 0]);
  });
});

describe("toSteps", () => {
  it("repeats each hour across four quarter-steps", () => {
    const hours = Array.from({ length: 24 }, (_, hour) => hour / 23);
    const steps = toSteps(hours, 96);
    expect(steps).toHaveLength(96);
    expect(steps.slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(steps.slice(92, 96)).toEqual([1, 1, 1, 1]);
  });
});

describe("selectShowcaseDay", () => {
  it("keeps a complete weekday", () => {
    expect(selectShowcaseDay("2026-10-29T23:00:00.000")).toBe("2026-10-29");
  });

  it("walks a complete weekend back to Friday", () => {
    expect(selectShowcaseDay("2026-10-31T23:00:00.000")).toBe("2026-10-30");
    expect(selectShowcaseDay("2026-11-01T23:00:00.000")).toBe("2026-10-30");
  });

  it("steps back from an unfinished day", () => {
    expect(selectShowcaseDay("2026-11-01T15:00:00.000")).toBe("2026-10-30");
  });
});

describe("pickCompleteDay", () => {
  it("prefers the latest day whose hours have all ended", () => {
    const times = [
      ...Array.from({ length: 24 }, (_, hour) => `2026-11-11T${String(hour).padStart(2, "0")}:00`),
      ...Array.from({ length: 24 }, (_, hour) => `2026-11-12T${String(hour).padStart(2, "0")}:00`),
    ];
    const values = times.map(() => 10);
    const picked = pickCompleteDay(times, values, new Date("2026-11-12T19:00:00Z"));
    expect(picked?.day).toBe("2026-11-11");
    expect(picked?.hours).toHaveLength(24);
  });
});

describe("tempo", () => {
  it("keeps a day the same length at both resolutions", () => {
    const bpm = 104;
    expect(dayLengthSeconds(bpm)).toBeCloseTo(24 * secondsPerStep(bpm, 24));
    expect(dayLengthSeconds(bpm)).toBeCloseTo(96 * secondsPerStep(bpm, 96));
  });
});

describe("projectTracks", () => {
  it("opens the gate on the commute and leaves the night closed", () => {
    const track: Track = {
      id: "manhattan",
      name: "Manhattan",
      drum: "kick",
      hours: [1, 1, 1, 1, 2, 5, 9, 14, 10, 6, 5, 5, 6, 7, 9, 12, 16, 18, 11, 7, 4, 2, 1, 1],
      details: Array.from({ length: 24 }, () => ""),
    };
    const [row] = projectTracks([track], 24);
    const gate = 0.4;
    expect(row?.values[3]).toBeLessThan(gate);
    expect(row?.values[6]).toBeGreaterThanOrEqual(gate);
    expect(row?.values[17]).toBe(1);
  });
});

describe("quakeRegion", () => {
  it("bins known places", () => {
    expect(quakeRegion(37.8, -122.4)).toBe("california");
    expect(quakeRegion(64.2, -149.5)).toBe("alaska");
    expect(quakeRegion(19.2, -155.5)).toBe("hawaii");
    expect(quakeRegion(-33.4, -70.6)).toBe("americas");
    expect(quakeRegion(35.7, 139.7)).toBe("pacific");
    expect(quakeRegion(51.5, -0.1)).toBe("distant");
  });
});
