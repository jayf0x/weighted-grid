// Mosaic generator for the organic-grid example.
//
// A flat per-tile dice roll (independent random shape every time) still reads as "randomized
// grid", not a mosaic — real mosaics have runs of similarly-sized tiles with occasional breaks,
// not uniform noise every step. So instead of rolling a shape per tile in isolation, a smoothly
// interpolated 1D value-noise trend drifts across the sequence and biases *nearby* tiles toward
// similar sizes (a "patch").
//
// Cards are a stand-in for real content (name + description + background image on each), so every
// card carries a real minimum footprint (CARD_MIN) on both axes — no 1x1/2x1 slivers. Size varies
// by discrete tiers (small/medium/large), not a +/-2 jitter, so patches actually read as different
// scales instead of near-uniform noise. Every card pins at most one axis strictly; `weight`/
// `stretch` fill the other, and the *pinned* axis gets a small `stretchX`/`stretchY` allowance too
// (see CARD_FLEX) so nothing sits fully rigid — that's what keeps leftover `fillComponent` space
// down to genuinely unreachable corners instead of whole dead columns, which is the only filler
// this example ever renders (no negative-space tiles are generated on purpose).
import type { ExampleTile } from "@/typing";

// ---- seeded hash: pseudo-random in [0,1) for an integer lattice point ----
function hash01(seed: number, i: number) {
  let h = (Math.imul(seed, 0x9e3779b9) ^ Math.imul(i, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// 1D value noise: smooth interpolation between hashed lattice points, so a "trend" drifts across
// the sequence instead of jumping independently at every step.
function makeNoise(seed: number) {
  return (x: number) => {
    const i0 = Math.floor(x);
    const t = smoothstep(x - i0);
    return hash01(seed, i0) + (hash01(seed, i0 + 1) - hash01(seed, i0)) * t;
  };
}

const SCALE = 4; // cell-size multiplier vs. the 10-col reference examples
const CARD_MIN = 2 * SCALE; // 8 — nothing thinner than this counts as a card (real content needs it)

// discrete size tiers (small/medium/large), not a small jitter — this is what makes patches read
// as genuinely different scales instead of near-uniform noise
const CARD_TIERS = [2 * SCALE, 3 * SCALE, 5 * SCALE]; // 8, 12, 20
const tierFor = (n: number) =>
  CARD_TIERS[Math.floor(n * CARD_TIERS.length) % CARD_TIERS.length];

// how far a card's *pinned* axis may still flex (via GridItem's stretchX/stretchY) beyond its tier —
// small on purpose: enough to close a stray 1-2 cell gap, not enough to blur the tier's identity.
// Note: this only tops up the *pinned* axis. The already-weight-driven axis (and every void axis)
// is governed by the `Grid`-level `stretch` prop instead (`meta.stretch` in the example) — that's
// the single lever for "how far can anything reach", items and voids alike.
const CARD_FLEX = Math.round(SCALE / 2) + 20; // 2

export function generateOrganicTiles(
  seed = 1,
  count = 20,
  nrCols = 30,
): ExampleTile[] {
  const sizeNoise = makeNoise(seed); // drifting "how big is this patch of tiles" trend
  const modeNoise = makeNoise(seed + 101); // drifting "which axis stays pinned" trend
  const pick = makeNoise(seed + 303); // per-tile jitter/picks, not a trend

  const tiles: ExampleTile[] = [];
  let prevKey = "";

  for (let i = 0; i < count; i++) {
    const size = sizeNoise(i / 5); // patches ~5 tiles wide
    const mode = modeNoise(i / 7); // patches ~7 tiles wide, independent period

    const jitterCols = pick(i * 1.7) < 0.6 ? 0 : 1;
    const jitterRows = pick(i * 2.3) < 0.6 ? 0 : 1;

    // the elastic axis gets its own independent tier draw — mirroring the pinned axis's size made
    // "elastic" tiles come out roughly square/same-scale as the strict ones instead of a distinct
    // shape family
    const elasticSize = pick(i * 4.3 + 11);

    let tile: ExampleTile;
    if (mode < 0.3) {
      // fully strict — both axes pinned; the occasional deliberately-static tile. Still gets
      // CARD_FLEX on both, so "strict" means "tier-sized", not "never moves a single cell".
      const wide = pick(i * 3.1) < 0.5;
      tile = wide
        ? {
            kind: "item",
            cols: tierFor(size) + jitterCols,
            rows: tierFor(elasticSize) + jitterRows,
            stretchX: CARD_FLEX,
            stretchY: CARD_FLEX,
          }
        : {
            kind: "item",
            cols: tierFor(elasticSize) + jitterCols,
            rows: tierFor(size) + jitterRows,
            stretchX: CARD_FLEX,
            stretchY: CARD_FLEX,
          };
    } else if (mode < 0.65) {
      // col-pinned, row axis elastic — "2 x auto". `weight` is the *literal* initial span for the
      // unpinned axis (see `spanFor`), not a small flex ratio — needs its own CARD_MIN+ range, or
      // the card starts out thinner than CARD_MIN and only `stretch` can fix it. Row axis is already
      // fully elastic (weight-driven); only the pinned col axis needs the extra `stretchX` nudge.
      tile = {
        kind: "item",
        cols: tierFor(size) + jitterCols,
        weight: tierFor(elasticSize) + jitterRows,
        stretchX: CARD_FLEX,
      };
    } else {
      // row-pinned, col axis elastic — "auto x 2"
      tile = {
        kind: "item",
        rows: tierFor(size) + jitterRows,
        weight: tierFor(elasticSize) + jitterCols,
        stretchY: CARD_FLEX,
      };
    }

    // anti-repetition: never place two tiles with the identical footprint back to back — a real
    // mosaic never sets the same exact stone twice in a row
    const key = JSON.stringify(tile);
    if (key === prevKey) {
      if (tile.cols) tile.cols += 1;
      else if (tile.rows) tile.rows += 1;
    }
    prevKey = JSON.stringify(tile);

    tiles.push(tile);
  }

  for (const { cols, rows, ...rest } of tiles) {
    if ((cols !== undefined && cols < CARD_MIN) || (rows !== undefined && rows < CARD_MIN)) {
      throw new Error(
        `generateOrganicTiles: card thinner than the ${CARD_MIN}-cell minimum: ${JSON.stringify({ cols, rows, ...rest })}`,
      );
    }
  }

  return tiles;
}
