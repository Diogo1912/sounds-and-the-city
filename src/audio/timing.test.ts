import { describe, expect, it } from "vitest";
import { missedSteps } from "./timing.ts";

describe("audio clock recovery", () => {
  it("keeps a near-due hit when the scheduler wakes a few milliseconds late", () => {
    expect(missedSteps(12, 11.99, 0.125)).toBe(0);
    expect(missedSteps(12, 12.007, 0.125)).toBe(0);
  });

  it("drops overdue hits without dropping a future beat or replaying a backlog", () => {
    expect(missedSteps(12, 12.07, 0.125)).toBe(1);
    expect(missedSteps(12, 12.253, 0.125)).toBe(2);
    expect(missedSteps(12, 12.301, 0.125)).toBe(3);
    expect(missedSteps(Infinity, 15, 0.125)).toBe(0);
  });
});
