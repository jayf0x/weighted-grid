// Mosaic generator for the organic-grid example.
//
// A flat per-tile dice roll (independent random shape every time) still reads as "randomized
// grid", not a mosaic — real mosaics have runs of similarly-sized tiles with occasional breaks,
// not uniform noise every step. So instead of rolling a shape per tile in isolation, a smoothly
// interpolated 1D value-noise trend drifts across the sequence and biases *nearby* tiles toward
// similar sizes (a "patch"); a second, independent noise channel decides when to break for a void,
// so voids don't sync up with the size trend. Card shapes pin at most one axis — `weight`/`stretch`
// fill the other — so stretch keeps doing real work instead of every tile sitting fully static in
// its own box.
//
// Cards are a stand-in for real content (name + description + background image on each), so every
// card carries a real minimum footprint (CARD_MIN) on both axes — no 1x1/2x1 slivers. Size varies
// by discrete tiers (small/medium/large), not a +/-2 jitter, so patches actually read as different
// scales instead of near-uniform noise. Void tiles are the opposite shape family: thin on one axis,
// long on the other — a shape no card (min CARD_MIN on both axes) can ever take, so a void reads
// unambiguously as intentional negative space cut in to move content into interesting places, not
// "a smaller card". `fillComponent` renders into whatever the packer leaves over regardless, so
// keeping void shapes in that same thin-and-long family keeps auto-filled holes visually coherent
// with the intentional ones.
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
const tierFor = (n: number) => CARD_TIERS[Math.floor(n * CARD_TIERS.length) % CARD_TIERS.length];

// thin on one axis, long on the other — a shape a real card (min CARD_MIN on both axes) can never
// take. Long axis stays under CARD_MIN so a void never reads "as thick as a card".
const VOID_LONG = CARD_MIN - 1;
const VOID_SHAPES: Array<Partial<Pick<CaseTile, "cols" | "rows" | "weight">>> = [
  { cols: 1, rows: VOID_LONG },
  { cols: VOID_LONG, rows: 1 },
  { cols: 1, rows: round(VOID_LONG * 0.6) },
  { cols: round(VOID_LONG * 0.6), rows: 1 },
  { cols: 1, weight: VOID_LONG }, // "1 x auto" — thin, row axis left elastic
];

export function generateOrganicTiles(seed = 1, count = 20): CaseTile[] {
  const sizeNoise = makeNoise(seed); // drifting "how big is this patch of tiles" trend
  const modeNoise = makeNoise(seed + 101); // drifting "which axis stays pinned" trend
  const voidNoise = makeNoise(seed + 202); // independent — voids shouldn't sync with the size trend
  const pick = makeNoise(seed + 303); // per-tile jitter/picks, not a trend

  const tiles: CaseTile[] = [];
  let sinceVoid = 0;
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

    let tile: Partial<Pick<CaseTile, "cols" | "rows" | "weight">>;
    if (mode < 0.3) {
      // fully strict — both axes pinned; the occasional deliberately-static tile
      const wide = pick(i * 3.1) < 0.5;
      tile = wide
        ? { cols: tierFor(size) + jitterCols, rows: tierFor(elasticSize) + jitterRows }
        : { cols: tierFor(elasticSize) + jitterCols, rows: tierFor(size) + jitterRows };
    } else if (mode < 0.65) {
      // col-pinned, row axis elastic — "2 x auto". `weight` is the *literal* initial span for the
      // unpinned axis (see `spanFor`), not a small flex ratio — needs its own CARD_MIN+ range, or
      // the card starts out thinner than CARD_MIN and only `stretch` can fix it.
      tile = { cols: tierFor(size) + jitterCols, weight: tierFor(elasticSize) + jitterRows };
    } else {
      // row-pinned, col axis elastic — "auto x 2"
      tile = { rows: tierFor(size) + jitterRows, weight: tierFor(elasticSize) + jitterCols };
    }

    // anti-repetition: never place two tiles with the identical footprint back to back — a real
    // mosaic never sets the same exact stone twice in a row
    const key = JSON.stringify(tile);
    if (key === prevKey) {
      if (tile.cols) tile.cols += 1;
      else if (tile.rows) tile.rows += 1;
    }
    prevKey = JSON.stringify(tile);

    tiles.push({ kind: "item", ...tile });
    sinceVoid++;

    const urge = voidNoise(i / 3);
    if ((sinceVoid >= 2 && urge > 0.5) || sinceVoid >= 5) {
      const shape = VOID_SHAPES[Math.floor(pick(i * 5.9) * VOID_SHAPES.length) % VOID_SHAPES.length];
      tiles.push({ kind: "void", ...shape });
      sinceVoid = 0;
    }
  }

  for (const t of tiles) {
    const { cols, rows } = t;
    if (t.kind === "item") {
      if ((cols !== undefined && cols < CARD_MIN) || (rows !== undefined && rows < CARD_MIN)) {
        throw new Error(`generateOrganicTiles: card thinner than the ${CARD_MIN}-cell minimum: ${JSON.stringify(t)}`);
      }
    } else if ((cols !== undefined && cols > CARD_MIN) || (rows !== undefined && rows > CARD_MIN)) {
      throw new Error(`generateOrganicTiles: void tile as thick as a card: ${JSON.stringify(t)}`);
    }
  }

  return tiles;
}
