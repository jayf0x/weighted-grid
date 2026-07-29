/** Neutral tint per index — a quiet grayscale sequence so weight/size reads clearly without
 * rainbow noise. */
export function tintFor(i: number): string {
  const steps = [96, 90, 84, 92, 88, 94];
  return `oklch(${steps[i % steps.length]}% 0.006 250)`;
}

/** A small, deliberate warm/cool palette (terracotta, ochre, ink-brown, dusty blue, sage, sand) —
 * built around the site's own `--color-accent`, not a rainbow cycle. Used by the flat-color organic
 * examples where the point is the *shape* of the mosaic, not per-tile content. */
const VIVID_PALETTE = [
  'oklch(62% 0.15 35)',
  'oklch(70% 0.14 75)',
  'oklch(34% 0.03 40)',
  'oklch(62% 0.09 230)',
  'oklch(55% 0.1 150)',
  'oklch(75% 0.05 60)',
];

export function vividTintFor(i: number): string {
  return VIVID_PALETTE[i % VIVID_PALETTE.length];
}
