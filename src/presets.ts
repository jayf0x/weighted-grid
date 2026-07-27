import type { GridItemProps } from './react';

/** Computes default props for all `count` items under a `mode`, given the grid's `nrCols` — one
 * call per render (not per item), since a running-bond brick pattern needs whole-row bookkeeping,
 * not just an item's own index. Explicit props on a `GridItem` always win — see `mode` handling in
 * `react.tsx`, which spreads these first. */
export type PresetFn = (count: number, nrCols: number) => Partial<GridItemProps>[];

const BRICK = 2;

/** Running-bond brick layout: rows of `BRICK`-wide tiles, alternating rows offset by half a brick
 * (a `BRICK/2`-wide tile at each end) so row 2 lands staggered under row 1's seams, like real
 * brickwork. Needs `nrCols` even for a seamless tiling; odd leaves one unused column per offset
 * row (a normal empty cell, same as any other gap). */
const mason: PresetFn = (count, nrCols) => {
  const workCols = nrCols - (nrCols % BRICK);
  const bricksPerRow = Math.max(1, workCols / BRICK);
  const alignedRow = Array(bricksPerRow).fill(BRICK);
  const offsetRow = [BRICK / 2, ...Array(Math.max(bricksPerRow - 1, 0)).fill(BRICK), BRICK / 2];

  const widths: number[] = [];
  for (let row = 0; widths.length < count; row++) widths.push(...(row % 2 === 0 ? alignedRow : offsetRow));

  return widths.slice(0, count).map((cols) => ({ cols, rows: 1 }));
};

export const presets: Record<string, PresetFn> = { mason };

export type PresetMode = keyof typeof presets;
