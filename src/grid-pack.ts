/**
 * Grid-slot allocator: the "auto" packer.
 *
 * Instead of packing rigid rectangles into a minimal box (see {@link ./core} for that), this
 * fills a fixed `cols x rows` grid *completely* by handing every item an integer block of cells.
 * Because the blocks are carved out of the grid by recursive splitting, they tile it exactly —
 * there are no gaps to detect or fill afterwards, and resizing the container is free (the caller
 * renders with CSS Grid `1fr` tracks, so the browser reflows without re-running this).
 *
 * Every per-item constraint (a fixed px size, a relative size, "just make it bigger") reduces to a
 * single `weight`: cell area is distributed proportionally. Unweighted items default to weight 1,
 * i.e. everything ends up roughly equal and near-square.
 */

export type GridInput = {
  /** Stable identifier echoed back on the placement. */
  id: string | number;
  /** Relative area. Defaults to 1. A 2 gets ~twice the cells of a 1. */
  weight?: number;
};

export type GridPlacement = {
  id: string | number;
  /** 0-based cell coordinates and integer spans; guaranteed within the grid and gap-free. */
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
};

export type GridPackOptions = {
  cols: number;
  rows: number;
};

type Region = { x: number; y: number; w: number; h: number };

/**
 * Recursively splits `region` (of `w*h` cells) among `items` (weight-carrying, non-empty), always
 * cutting the longer axis so blocks trend square.
 *
 * Correctness invariant: on entry `region.w * region.h >= items.length`. Every cut preserves it for
 * both sides, so the recursion always bottoms out at a 1-item region — no gaps, no overlaps, no
 * degenerate spans. Weights steer the *position* of each cut, but never at the cost of the invariant.
 */
const carve = (region: Region, items: (GridInput & { weight: number })[], out: GridPlacement[]): void => {
  const n = items.length;
  if (n === 1) {
    out.push({ id: items[0].id, col: region.x, row: region.y, colSpan: region.w, rowSpan: region.h });
    return;
  }

  const vertical = region.w >= region.h; // cut the longer axis
  const len = vertical ? region.w : region.h;
  const depth = vertical ? region.h : region.w;
  const total = items.reduce((s, it) => s + it.weight, 0);

  // A split into groups of `s` and `n - s` items fits along `len` iff each side has enough columns
  // for its items: ceil(s/depth) + ceil((n-s)/depth) <= len. Splitting on whole strips of the
  // shorter axis (s a multiple of `depth`) is always feasible, so a valid `s` always exists.
  const feasible = (s: number) => Math.ceil(s / depth) + Math.ceil((n - s) / depth) <= len;

  // Ideal split index by weight (contiguous prefix nearest half the weight), then snap outward to
  // the nearest feasible index. Keeps groups weight-balanced without breaking the invariant.
  let ideal = 1;
  let acc = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < n - 1; i++) {
    acc += items[i].weight;
    const diff = Math.abs(acc - total / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      ideal = i + 1;
    }
  }
  let splitAt = ideal;
  for (let d = 0; d < n; d++) {
    if (ideal - d >= 1 && feasible(ideal - d)) {
      splitAt = ideal - d;
      break;
    }
    if (ideal + d <= n - 1 && feasible(ideal + d)) {
      splitAt = ideal + d;
      break;
    }
  }

  const groupA = items.slice(0, splitAt);
  const groupB = items.slice(splitAt);
  const weightA = groupA.reduce((s, it) => s + it.weight, 0);

  // Position the cut by weight, clamped so each side keeps at least ceil(count/depth) strips.
  const min = Math.ceil(groupA.length / depth);
  const max = len - Math.ceil(groupB.length / depth);
  const cut = Math.min(Math.max(Math.round(len * (weightA / total)), min), max);

  if (vertical) {
    carve({ x: region.x, y: region.y, w: cut, h: region.h }, groupA, out);
    carve({ x: region.x + cut, y: region.y, w: region.w - cut, h: region.h }, groupB, out);
  } else {
    carve({ x: region.x, y: region.y, w: region.w, h: cut }, groupA, out);
    carve({ x: region.x, y: region.y + cut, w: region.w, h: region.h - cut }, groupB, out);
  }
};

/**
 * Places every item into a `cols x rows` grid, filling it exactly. Output order matches input.
 *
 * If there are more items than cells, `rows` is grown to fit — a soft grid never drops an item.
 */
export const packGrid = <T extends GridInput>(items: T[], { cols, rows }: GridPackOptions): GridPlacement[] => {
  if (items.length === 0) return [];
  if (cols < 1) throw new Error(`cols must be >= 1, got ${cols}`);

  // ponytail: auto-grow rows rather than error/drop. Soft grid > strict grid per the API intent.
  const neededRows = Math.max(rows, Math.ceil(items.length / cols));

  const weighted = items.map((it) => ({ ...it, weight: it.weight && it.weight > 0 ? it.weight : 1 }));

  const out: GridPlacement[] = [];
  carve({ x: 0, y: 0, w: cols, h: neededRows }, weighted, out);

  // Restore input order (carve emits in split order, close but not identical).
  const byId = new Map(out.map((p) => [p.id, p]));
  return items.map((it) => byId.get(it.id) as GridPlacement);
};

// ponytail: binary-split treemap. Aspect ratios are decent, not optimal — upgrade to a squarified
// treemap only if blocks look too elongated in practice. Invariants are covered by tests/grid-pack.test.ts.
