import type { PartialGridItem, PresetFactory } from './types';

export type OrganicPresetOptions = {
  seed?: number;
  /** Multiplies every tier fraction — >1 for chunkier tiles, <1 for finer ones. */
  size?: number;
};

/** Drifting mosaic: a smoothly interpolated noise trend biases nearby items toward similar size
 * tiers, so the result reads as runs of similarly-sized tiles with occasional breaks rather than
 * flat per-item noise. Each item pins one or two axes at a discrete small/medium/large tier
 * (scaled off `nrCols`). `itemDefaults` (default: `{ stretch: Infinity }`, so gaps fill by
 * default) is applied to every tile *before* its computed `cols`/`rows`/`weight`, so it can set
 * any other `GridItemProps` (`stretch`, `className`, `animateSize`, …) without touching the shape
 * the preset computes — a `GridItem`'s own explicit props still win over all of it. */
export const organicPreset: PresetFactory<OrganicPresetOptions> =
  ({ seed = 1, size: sizeMult = 1 } = {}, itemDefaults = {}) =>
  ({ count, nrCols }) => {
    const tierSizes = TIER_FRACTIONS.map((f) => Math.max(2, Math.round(f * sizeMult * nrCols)));
    const cardMin = tierSizes[0];
    const tierFor = (n: number) => tierSizes[Math.floor(n * tierSizes.length) % tierSizes.length];

    const sizeNoise = makeNoise(seed); // drifting "how big is this patch of tiles" trend
    const modeNoise = makeNoise(seed + 101); // drifting "which axis stays pinned" trend
    const pick = makeNoise(seed + 303); // per-tile jitter/picks, not a trend

    const tiles: PartialGridItem[] = [];
    let prevKey = '';

    for (let i = 0; i < count; i++) {
      const size = sizeNoise(i / 5); // patches ~5 tiles wide
      const mode = modeNoise(i / 7); // patches ~7 tiles wide, independent period

      const jitterCols = pick(i * 1.7) < 0.6 ? 0 : 1;
      const jitterRows = pick(i * 2.3) < 0.6 ? 0 : 1;
      // the elastic axis gets its own independent tier draw, so elastic tiles come out roughly
      // square/same-scale as the strict ones instead of a distinct shape family
      const elasticSize = pick(i * 4.3 + 11);

      let shape: PartialGridItem;
      if (mode < 0.3) {
        // fully strict — both axes pinned; the occasional deliberately-static tile
        const wide = pick(i * 3.1) < 0.5;
        shape = wide
          ? {
              cols: tierFor(size) + jitterCols,
              rows: tierFor(elasticSize) + jitterRows,
            }
          : {
              cols: tierFor(elasticSize) + jitterCols,
              rows: tierFor(size) + jitterRows,
            };
      } else if (mode < 0.65) {
        // col-pinned, row axis elastic — "2 x auto"
        shape = {
          cols: tierFor(size) + jitterCols,
          weight: tierFor(elasticSize) + jitterRows,
        };
      } else {
        // row-pinned, col axis elastic — "auto x 2"
        shape = {
          rows: tierFor(size) + jitterRows,
          weight: tierFor(elasticSize) + jitterCols,
        };
      }
      const tile: PartialGridItem = {
        stretch: Number.POSITIVE_INFINITY,
        ...itemDefaults,
        ...shape,
      };

      // anti-repetition: never place two tiles with the identical footprint back to back
      const key = JSON.stringify(tile);
      if (key === prevKey) {
        if (tile.cols) tile.cols += 1;
        else if (tile.rows) tile.rows += 1;
      }
      prevKey = JSON.stringify(tile);

      tiles.push(tile);
    }

    for (const { cols, rows } of tiles) {
      if ((cols !== undefined && cols < cardMin) || (rows !== undefined && rows < cardMin)) {
        throw new Error(`organicPreset: tile thinner than the ${cardMin}-cell minimum`);
      }
    }

    return tiles;
  };

// seeded hash: pseudo-random in [0,1) for an integer lattice point
function hash01(seed: number, i: number) {
  let h = (Math.imul(seed, 0x9e3779b9) ^ Math.imul(i, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// 1D value noise: smooth interpolation between hashed lattice points, so a trend drifts across the
// sequence instead of jumping independently at every step.
function makeNoise(seed: number) {
  return (x: number) => {
    const i0 = Math.floor(x);
    const t = smoothstep(x - i0);
    return hash01(seed, i0) + (hash01(seed, i0 + 1) - hash01(seed, i0)) * t;
  };
}

// Tile tiers, as a fraction of `nrCols` rather than an absolute cell count, so the preset scales
// to any `nrCols` instead of one tuned column count.
const TIER_FRACTIONS = [8 / 48, 12 / 48, 20 / 48]; // small/medium/large
