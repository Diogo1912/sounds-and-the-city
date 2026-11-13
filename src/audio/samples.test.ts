import { describe, expect, it } from "vitest";
import manifest from "../../public/samples/manifest.json" with { type: "json" };
import { SAMPLE_BY_TRACK } from "./samples.ts";

describe("sample map", () => {
  it("uses every file in the manifest exactly once", () => {
    const expected = Object.values(manifest.datasets).flatMap((tracks) => Object.values(tracks));
    const used = Object.values(SAMPLE_BY_TRACK);
    expect(used).toHaveLength(expected.length);
    expect(new Set(used)).toEqual(new Set(expected));
  });
});
