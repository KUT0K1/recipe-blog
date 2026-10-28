export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

export function isValidServings(value: number, max = MAX_SERVINGS): boolean {
  return Number.isInteger(value) && value >= MIN_SERVINGS && value <= max;
}

/** Upper bound for the serving control; never below the recipe's own yield. */
export function maxServingsFor(baseServings: number): number {
  return Math.max(MAX_SERVINGS, baseServings);
}

export interface ScalableAmount {
  amount: number | null;
  scalable?: boolean;
}

/**
 * Scales a numeric quantity linearly by servings. `null` amounts ("to taste")
 * and lines marked `scalable: false` are returned unchanged.
 */
export function scaleAmount(
  line: ScalableAmount,
  baseServings: number,
  targetServings: number,
): number | null {
  if (!Number.isInteger(baseServings) || baseServings <= 0) {
    throw new RangeError(`Invalid base servings: ${baseServings}`);
  }
  if (!Number.isInteger(targetServings) || targetServings <= 0) {
    throw new RangeError(`Invalid target servings: ${targetServings}`);
  }
  if (line.amount === null || line.scalable === false) return line.amount;
  return (line.amount * targetServings) / baseServings;
}
