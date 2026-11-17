import { describe, expect, it } from "vitest";
import { envelopePoints, moveEnvelope, waveform } from "./patchGeometry.ts";

const envelope = { attack: 50, decay: 460, sustain: 62, release: 150 };

describe("synth graphs", () => {
  it("round-trips envelope handle coordinates without changing their values", () => {
    const points = envelopePoints(envelope);
    expect(moveEnvelope(envelope, "attack", ...points.attack)).toEqual(envelope);
    expect(moveEnvelope(envelope, "decay", ...points.decay)).toEqual(envelope);
    expect(moveEnvelope(envelope, "release", ...points.release)).toEqual(envelope);
  });

  it("bounds dragged handles to valid attack, sustain, and release values", () => {
    expect(moveEnvelope(envelope, "attack", -2, 0).attack).toBe(1);
    expect(moveEnvelope(envelope, "decay", 0.3, -2).sustain).toBe(100);
    expect(moveEnvelope(envelope, "release", 2, 0).release).toBe(3000);
  });

  it("draws opposite levels on either half of a square wave", () => {
    expect(waveform("square", 1.25)).toBe(1);
    expect(waveform("square", 1.75)).toBe(-1);
  });
});
