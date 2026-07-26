/** Neutral tint per index — a quiet grayscale sequence so weight/size reads clearly without
 * rainbow noise. */
export function tintFor(i: number): string {
  const steps = [96, 90, 84, 92, 88, 94];
  return `oklch(${steps[i % steps.length]}% 0.006 250)`;
}
