import { describe, expect, it } from "vitest";
import manifest from "../../public/samples/manifest.json" with { type: "json" };
import { AMSTERDAM_VOICES } from "../kits.ts";
import { SAMPLE_BY_TRACK, sampleOnset } from "./samples.ts";

describe("sample map", () => {
  it("uses every field recording in the manifest exactly once", () => {
    expect(SAMPLE_BY_TRACK).toEqual(manifest);
    expect(Object.keys(SAMPLE_BY_TRACK).sort()).toEqual(AMSTERDAM_VOICES.map((voice) => voice.id).sort());
    expect(new Set(Object.values(SAMPLE_BY_TRACK)).size).toBe(AMSTERDAM_VOICES.length);
  });
});

describe("sample attack alignment", () => {
  it("skips a quiet lead-in and preserves a small margin before the hit", () => {
    const sample = new Float32Array(48000).fill(0.001);
    sample.fill(0.65, 4800, 5184);
    expect(sampleOnset(sample, 48000)).toBeCloseTo(0.098);
  });

  it("keeps immediate attacks at zero and does not trim silence or late ambience", () => {
    const sample = new Float32Array(48000);
    expect(sampleOnset(sample, 48000)).toBe(0);
    sample.fill(0.65, 0, 480);
    expect(sampleOnset(sample, 48000)).toBe(0);
    sample.fill(0);
    sample.fill(0.65, 10000, 11000);
    expect(sampleOnset(sample, 48000)).toBe(0);
  });
});
