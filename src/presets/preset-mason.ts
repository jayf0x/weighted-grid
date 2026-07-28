import type { PresetFactory } from './types';

export type MasonPresetOptions = {
  /** Brick width in columns. */
  brick?: number;
};

/** Running-bond brick: rows of `brick`-wide tiles, alternate rows offset by a half-brick. Needs
 * even `nrCols` for a seamless tiling; odd leaves one empty column per offset row. */
export const masonPreset: PresetFactory<MasonPresetOptions> =
  ({ brick = 2 } = {}, itemDefaults = {}) =>
  ({ count, nrCols }) => {
    const workCols = nrCols - (nrCols % brick);
    const bricksPerRow = Math.max(1, workCols / brick);
    const alignedRow = Array(bricksPerRow).fill(brick);
    const offsetRow = [brick / 2, ...Array(Math.max(bricksPerRow - 1, 0)).fill(brick), brick / 2];

    const widths: number[] = [];
    for (let row = 0; widths.length < count; row++) widths.push(...(row % 2 === 0 ? alignedRow : offsetRow));

    return widths.slice(0, count).map((cols) => ({ ...itemDefaults, cols, rows: 1 }));
  };
