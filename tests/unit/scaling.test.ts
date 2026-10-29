import { describe, expect, it } from "vitest";
import { isValidServings, maxServingsFor, scaleAmount } from "../../src/lib/scaling";

describe("scaleAmount", () => {
  it("doubles scalable amounts from 2 to 4 servings", () => {
    expect(scaleAmount({ amount: 400 }, 2, 4)).toBe(800);
    expect(scaleAmount({ amount: 1.5 }, 2, 4)).toBe(3);
  });

  it("scales down with decimals", () => {
    expect(scaleAmount({ amount: 200 }, 8, 3)).toBe(75);
    expect(scaleAmount({ amount: 1 }, 4, 1)).toBe(0.25);
  });

  it("leaves 'to taste' amounts untouched", () => {
    expect(scaleAmount({ amount: null }, 2, 4)).toBeNull();
  });

  it("leaves non-scalable amounts untouched", () => {
    expect(scaleAmount({ amount: 1, scalable: false }, 2, 6)).toBe(1);
  });

  it("is deterministic and reversible", () => {
    const up = scaleAmount({ amount: 333 }, 3, 7)!;
    expect(scaleAmount({ amount: up }, 7, 3)).toBeCloseTo(333, 10);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects invalid target servings %s", (target) => {
    expect(() => scaleAmount({ amount: 1 }, 2, target)).toThrow(RangeError);
  });

  it("rejects invalid base servings", () => {
    expect(() => scaleAmount({ amount: 1 }, 0, 2)).toThrow(RangeError);
  });
});

describe("serving bounds", () => {
  it("accepts integers from 1 to 20", () => {
    expect(isValidServings(1)).toBe(true);
    expect(isValidServings(20)).toBe(true);
    expect(isValidServings(0)).toBe(false);
    expect(isValidServings(21)).toBe(false);
    expect(isValidServings(2.5)).toBe(false);
  });

  it("never caps below the recipe's own yield", () => {
    expect(maxServingsFor(4)).toBe(20);
    expect(maxServingsFor(24)).toBe(24);
  });
});
