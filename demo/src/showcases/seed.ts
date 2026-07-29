/** Deterministic starting weights.
 *
 * Every case that opens on a weighted mosaic uses this instead of `Math.random`: the first thing
 * a visitor sees is a designed layout, identical on every load, and screenshots stay comparable
 * between runs. Mixture is roughly 12% heavy, 30% medium, the rest unit-sized — enough variety to
 * read as a mosaic without any single tile dominating. */
export const seededWeight = (i: number): number => {
  const r = Math.sin(i * 12.9898) * 43758.5453;
  const f = r - Math.floor(r);
  return f < 0.12 ? 3 : f < 0.42 ? 2 : 1;
};
