import { describe, expect, it } from "vitest";
import manifest from "../../public/samples/manifest.json" with { type: "json" };
import { AMSTERDAM_VOICES } from "../kits.ts";
import { SAMPLE_BY_TRACK } from "./samples.ts";

describe("sample map", () => {
  it("uses every field recording in the manifest exactly once", () => {
    expect(SAMPLE_BY_TRACK).toEqual(manifest);
    expect(Object.keys(SAMPLE_BY_TRACK).sort()).toEqual(AMSTERDAM_VOICES.map((voice) => voice.id).sort());
    expect(new Set(Object.values(SAMPLE_BY_TRACK)).size).toBe(AMSTERDAM_VOICES.length);
  });
});
