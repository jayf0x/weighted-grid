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
// Shape grammar: cards are never thinner than CARD_MIN cells on either axis (real content needs a
// 2x3 / 3x2 / 2x-auto footprint); void tiles are never that thick — thin-and-long is a shape a real
// card can never take, so a void reads unambiguously as intentional negative space, not "a smaller
// card".

// ---- seeded hash: pseudo-random in [0,1) for an integer lattice point ----
function hash01(seed, i) {
  let h = (Math.imul(seed, 0x9e3779b9) ^ Math.imul(i, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

const smoothstep = (t) => t * t * (3 - 2 * t);

// 1D value noise: smooth interpolation between hashed lattice points, so a "trend" drifts across
// the sequence instead of jumping independently at every step.
function makeNoise(seed) {
  return (x) => {
    const i0 = Math.floor(x);
    const t = smoothstep(x - i0);
    return hash01(seed, i0) + (hash01(seed, i0 + 1) - hash01(seed, i0)) * t;
  };
}

const round = Math.round;

const SCALE = 3; // 30-col dev grid vs. the 10-col reference examples — cards span ~3x the units
const CARD_MIN = 2 * SCALE; // 6 — nothing thinner than this counts as a card

// thin/long — a shape a real card (min 6 cells wide/tall) can never take
const VOID_SHAPES = [
  { cols: 1, rows: 3 },
  { cols: 3, rows: 1 },
  { cols: 2, rows: 1 },
  { cols: 1, weight: 1 }, // "1 x auto" — thin, row axis left elastic
];

export function generateOrganicTiles(seed = 1, count = 20) {
  const sizeNoise = makeNoise(seed); // drifting "how big is this patch of tiles" trend
  const modeNoise = makeNoise(seed + 101); // drifting "which axis stays pinned" trend
  const voidNoise = makeNoise(seed + 202); // independent — voids shouldn't sync with the size trend
  const pick = makeNoise(seed + 303); // per-tile jitter/picks, not a trend

  const tiles = [];
  let sinceVoid = 0;
  let prevKey = "";

  for (let i = 0; i < count; i++) {
    const size = sizeNoise(i / 5); // patches ~5 tiles wide
    const mode = modeNoise(i / 7); // patches ~7 tiles wide, independent period

    const jitterCols = pick(i * 1.7) < 0.6 ? 0 : 1;
    const jitterRows = pick(i * 2.3) < 0.6 ? 0 : 1;

    let tile;
    if (mode < 0.3) {
      // fully strict — both axes pinned; the occasional deliberately-static tile
      const wide = pick(i * 3.1) < 0.5;
      tile = wide
        ? { cols: 3 * SCALE + round(size * 2) + jitterCols, rows: 2 * SCALE + jitterRows }
        : { cols: 2 * SCALE + jitterCols, rows: 3 * SCALE + round(size * 2) + jitterRows };
    } else if (mode < 0.65) {
      // col-pinned, row axis elastic — "2 x auto". `weight` is the *literal* initial span for the
      // unpinned axis (see `spanFor`), not a small flex ratio — it needs the same 6-10 range as the
      // pinned axis, or the card starts out thinner than CARD_MIN and only `stretch` can fix it.
      tile = { cols: 2 * SCALE + round(size * 2) + jitterCols, weight: 2 * SCALE + round(size * 2) + jitterRows };
    } else {
      // row-pinned, col axis elastic — "auto x 2"
      tile = { rows: 2 * SCALE + round(size * 2) + jitterRows, weight: 2 * SCALE + round(size * 2) + jitterCols };
    }

    // anti-repetition: never place two tiles with the identical footprint back to back — a real
    // mosaic never sets the same exact stone twice in a row
    const key = JSON.stringify(tile);
    if (key === prevKey) {
      if (tile.cols) tile.cols += 1;
      else tile.rows += 1;
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
    const cols = t.cols;
    const rows = t.rows;
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
