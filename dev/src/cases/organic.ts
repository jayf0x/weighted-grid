// Mosaic generator for the organic-grid example.
//
// A flat per-tile dice roll (independent random shape every time) still reads as "randomized
// grid", not a mosaic — real mosaics have runs of similarly-sized tiles with occasional breaks,
// not uniform noise every step. So instead of rolling a shape per tile in isolation, a smoothly
// interpolated 1D value-noise trend drifts across the sequence and biases *nearby* tiles toward
// similar sizes (a "patch"); a second, independent noise channel decides when to break for a void,
// so voids don't sync up with the size trend.
//
// Cards are a stand-in for real content (name + description + background image on each), so every
// card carries a real minimum footprint (CARD_MIN) on both axes — no 1x1/2x1 slivers. Size varies
// by discrete tiers (small/medium/large), not a +/-2 jitter, so patches actually read as different
// scales instead of near-uniform noise. Every card pins at most one axis strictly; `weight`/
// `stretch` fill the other, and the *pinned* axis gets a small `stretchX`/`stretchY` allowance too
// (see CARD_FLEX) so nothing sits fully rigid — that's what keeps leftover `fillComponent` space
// down to genuinely unreachable corners instead of whole dead columns.
//
// Void tiles are the opposite shape family: thin and pinned on one axis (never as thick as a card),
// left fully weight/stretch-driven on the other — so a void naturally grows to close whatever gap
// it borders instead of leaving a sliver for `fillComponent` to plug. A void reads unambiguously as
// intentional negative space cut in to move content into interesting places, not "a smaller card".
//
// Composition targets roughly 80% item / 15% void / 5% incidental filler by *area* (tracked via a
// running tally, not a per-tile coin flip) — filler is never generated on purpose, it's just
// whatever a real CSS-Grid pack can't reach even after stretch.
import type { CaseTile } from "../lib/case";

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

const round = Math.round;

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
// is governed by the `Grid`-level `stretch` prop instead (`meta.stretch` in the case file) — that's
// the single lever for "how far can anything reach", items and voids alike.
const CARD_FLEX = Math.round(SCALE / 2) + 20; // 2

// thin and pinned on one axis (never as thick as a card — CARD_MIN is the ceiling), fully
// weight/stretch-driven on the other, so a void grows to close whatever gap it borders instead of
// leaving a sliver for `fillComponent`. `weight` here is only the *initial* guess (see `spanFor`);
// `stretch` (on by default) takes it the rest of the way. Thin-axis thickness scales with `nrCols` —
// a 1-cell sliver reads fine on a 10-col reference grid but disappears on a 48-col one; ponytail:
// scaled off `nrCols` alone (the one grid dimension known before generation — real row count is
// emergent from placement), clamped to [2,3] so a void still never approaches CARD_MIN.
const voidThinFor = (nrCols: number) =>
  Math.max(2, Math.min(3, Math.round(nrCols / 16)));
const VOID_WEIGHT_TIERS = [CARD_MIN, CARD_MIN + SCALE, CARD_MIN + 2 * SCALE]; // 8, 12, 16

// composition target, tracked by running cell-area tally rather than a per-tile coin flip — filler
// is never generated on purpose, it's whatever's left after stretch can't reach it
const TARGET_VOID_AREA_FRAC = 0.15;

export function generateOrganicTiles(
  seed = 1,
  count = 20,
  nrCols = 30,
): CaseTile[] {
  const voidThin = voidThinFor(nrCols);
  const sizeNoise = makeNoise(seed); // drifting "how big is this patch of tiles" trend
  const modeNoise = makeNoise(seed + 101); // drifting "which axis stays pinned" trend
  const voidNoise = makeNoise(seed + 202); // independent — voids shouldn't sync with the size trend
  const pick = makeNoise(seed + 303); // per-tile jitter/picks, not a trend

  const tiles: CaseTile[] = [];
  let itemArea = 0;
  let voidArea = 0;
  let sinceVoid = 0;
  let prevKey = "";

  const areaOf = (t: Partial<Pick<CaseTile, "cols" | "rows" | "weight">>) =>
    (t.cols ?? t.weight ?? 1) * (t.rows ?? t.weight ?? 1);

  for (let i = 0; i < count; i++) {
    const urge = voidNoise(i / 3);
    const voidFrac = voidArea / Math.max(1, itemArea + voidArea);
    const wantsVoid =
      voidFrac < TARGET_VOID_AREA_FRAC &&
      ((sinceVoid >= 2 && urge > 0.45) || sinceVoid >= 5);

    if (wantsVoid) {
      const vertical = pick(i * 5.9) < 0.5;
      const longWeight =
        VOID_WEIGHT_TIERS[
          Math.floor(pick(i * 6.7) * VOID_WEIGHT_TIERS.length) %
            VOID_WEIGHT_TIERS.length
        ];
      const shape = vertical
        ? { cols: voidThin, weight: longWeight }
        : { rows: voidThin, weight: longWeight };
      tiles.push({ kind: "void", ...shape });
      voidArea += areaOf(shape);
      sinceVoid = 0;
      continue;
    }

    const size = sizeNoise(i / 5); // patches ~5 tiles wide
    const mode = modeNoise(i / 7); // patches ~7 tiles wide, independent period

    const jitterCols = pick(i * 1.7) < 0.6 ? 0 : 1;
    const jitterRows = pick(i * 2.3) < 0.6 ? 0 : 1;

    // the elastic axis gets its own independent tier draw — mirroring the pinned axis's size made
    // "elastic" tiles come out roughly square/same-scale as the strict ones instead of a distinct
    // shape family
    const elasticSize = pick(i * 4.3 + 11);

    let tile: CaseTile;
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
    itemArea += areaOf(tile);
    sinceVoid++;
  }

  for (const t of tiles) {
    const { cols, rows } = t;
    if (t.kind === "item") {
      if (
        (cols !== undefined && cols < CARD_MIN) ||
        (rows !== undefined && rows < CARD_MIN)
      ) {
        throw new Error(
          `generateOrganicTiles: card thinner than the ${CARD_MIN}-cell minimum: ${JSON.stringify(t)}`,
        );
      }
    } else if (
      (cols !== undefined && cols > CARD_MIN) ||
      (rows !== undefined && rows > CARD_MIN)
    ) {
      throw new Error(
        `generateOrganicTiles: void tile as thick as a card: ${JSON.stringify(t)}`,
      );
    }
  }

  return tiles;
}
