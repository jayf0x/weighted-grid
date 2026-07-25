import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { GridItem, type GridItemProps } from './react';

export const toCss = (n: number | string): string => (typeof n === 'number' ? `${n}px` : n);

/** Valid elements among `children`, matching `isTarget`. A profiler/compiler (e.g. Million Lint)
 * can wrap each element in an instrumentation component, pushing the real one into
 * `props.children` — so an element that fails `isTarget` gets one look one level down before
 * being kept as-is. No `isTarget` means no filtering or unwrapping. */
export const asGridItems = (children: ReactNode) =>
  Children.toArray(children).reduce<ReactElement<GridItemProps>[]>((items, el) => {
    if (!isValidElement(el)) {
      return items;
    }

    let item = el as ReactElement<GridItemProps>;
    if (item.type !== GridItem) {
      const child = (el.props as { children?: unknown }).children;

      item = (isValidElement(child) && child.type === GridItem ? child : el) as ReactElement<GridItemProps>;
    }

    items.push(item);
    return items;
  }, []);

const clamp = (n: number, max: number): number => Math.max(1, Math.min(max, Math.round(n)));

/**
 * Row/column span for one item. One rule, no overloading: `weight` is the default size for *both*
 * axes (weight 2 → a 2×2 block, so equal weights are equal squares); `cols`/`rows` override that
 * per-axis for organic shapes (`cols={4}` on a weight-2 item → 4 wide, 2 tall). Absent everywhere,
 * an item is 1×1. `colSpan` is clamped to the grid's column count so it can never overflow the row.
 */
export const spanFor = (props: GridItemProps, nrCols: number): { colSpan: number; rowSpan: number } => {
  const weight = typeof props.weight === 'number' && props.weight > 0 ? props.weight : 1;

  return {
    colSpan: clamp(props.cols ?? weight, nrCols),
    rowSpan: Math.max(1, Math.round(props.rows ?? weight)),
  };
};

export type Span = { colSpan: number; rowSpan: number };

/** Where one item lands. Starts are **0-indexed**; add 1 for CSS `grid-column-start`/`grid-row-start`. */
export type Placement = { colStart: number; rowStart: number; colSpan: number; rowSpan: number };

export type Placed = {
  /** One entry per input span, in input order. */
  placements: Placement[];
  /** Rows occupied (>= 1). */
  rows: number;
  /** `occupancy[r][c]` = is cell (row r, col c) covered. Rows may be shorter than `rows` if empty. */
  occupancy: boolean[][];
};

/**
 * Place `spans` in a `cols`-wide grid — a faithful-enough port of CSS Grid auto-placement, so the
 * caller can stretch exactly the occupied rows *and* reason about dead cells. Mirrors
 * `grid-auto-flow: row` (`isPacked=false`, sparse cursor that never moves backward) and `row dense`
 * (`isPacked=true`, first-fit from the top). This is the single source of truth for placement —
 * `packedRowCount` and the dead-zone analyzer both build on it.
 */
export const placeSpans = (spans: Span[], nrCols: number, isPacked: boolean): Placed => {
  const occupancy: boolean[][] = [];
  const row = (r: number): boolean[] => {
    while (occupancy.length <= r) occupancy.push(new Array(nrCols).fill(false));
    return occupancy[r];
  };
  const fits = (r: number, c: number, cs: number, rs: number): boolean => {
    for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) if (row(i)[j]) return false;
    return true;
  };

  const placements: Placement[] = [];
  let cursorR = 0;
  let cursorC = 0;
  let maxRow = 0;

  for (const { colSpan, rowSpan } of spans) {
    const cs = Math.min(colSpan, nrCols);
    const rs = rowSpan;
    let r = isPacked ? 0 : cursorR;
    let c = isPacked ? 0 : cursorC;

    while (c > nrCols - cs || !fits(r, c, cs, rs)) {
      c++;
      if (c > nrCols - cs) {
        r++;
        c = 0;
      }
    }

    for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) row(i)[j] = true;
    placements.push({ colStart: c, rowStart: r, colSpan: cs, rowSpan: rs });
    maxRow = Math.max(maxRow, r + rs);
    if (!isPacked) {
      cursorR = r;
      cursorC = c + cs;
    }
  }

  return { placements, rows: Math.max(1, maxRow), occupancy };
};

/** Rows the given spans occupy in a `nrCols`-wide grid (>= 1). Thin wrapper over {@link placeSpans}. */
export const packedRowCount = (spans: Span[], nrCols: number, isPacked: boolean): number =>
  placeSpans(spans, nrCols, isPacked).rows;

/** Per-axis growth cap: how many extra cells (beyond the original span) an item's axis may gain
 * absorbing dead cells. `Infinity` = fill as far as possible, `0` = never grows. An axis driven by
 * `weight` (no `cols`/`rows` pin) defaults to the grid's `stretch` prop; a pinned axis defaults to
 * `0` — but `GridItem`'s own `stretch`/`stretchX`/`stretchY` can override either default, so a
 * pinned axis can still flex a little, or an elastic one can be capped tighter than the grid default. */
export type StretchCaps = { col: number; row: number };

export const stretchCapsOf = (props: GridItemProps, gridStretch: number): StretchCaps => {
  const colDefault = props.cols == null ? gridStretch : 0;
  const rowDefault = props.rows == null ? gridStretch : 0;
  return {
    col: props.stretchX ?? props.stretch ?? colDefault,
    row: props.stretchY ?? props.stretch ?? rowDefault,
  };
};

/**
 * Grow items into adjacent dead cells so the span grid fills without reordering — the
 * "dead-zone-aware" pass on top of {@link placeSpans}. Growth is **fair**: each pass, every
 * still-growable axis grows by at most one cell (first free direction: right, left, down, up), so
 * slack is shared round-robin instead of the first item eating it all. Repeats to a fixpoint. `caps`
 * (see {@link stretchCapsOf}) bounds how many extra cells each item may gain *per axis* over its
 * original span. Returns a fresh placement array, same length/order as the input. Deterministic.
 */
export const fillDeadZones = (
  placements: Placement[],
  caps: StretchCaps[],
  nrCols: number,
  nrRows: number,
): Placement[] => {
  const out = placements.map((p) => ({ ...p }));
  const orig = placements.map((p) => ({ colSpan: p.colSpan, rowSpan: p.rowSpan }));
  const occ: boolean[][] = Array.from({ length: nrRows }, () => new Array<boolean>(nrCols).fill(false));
  const set = (r: number, c: number) => {
    if (occ[r]) occ[r][c] = true;
  };
  for (const p of out)
    for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
      for (let c = p.colStart; c < p.colStart + p.colSpan; c++) set(r, c);

  // A column/row edge is growable for `p` only if in-bounds and free across the whole edge.
  const colFree = (p: Placement, c: number): boolean => {
    if (c < 0 || c >= nrCols) return false;
    for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++) if (!occ[r] || occ[r][c]) return false;
    return true;
  };
  const rowFree = (p: Placement, r: number): boolean => {
    if (r < 0 || r >= nrRows || !occ[r]) return false;
    for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r][c]) return false;
    return true;
  };

  // Fair fixpoint: each pass, every elastic axis grows by at most ONE cell (first free direction).
  // Sharing slack across passes keeps growth even (A +1, then B +1) instead of A eating it all.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      const p = out[i];
      const colRoom = p.colSpan - orig[i].colSpan < caps[i].col;
      const rowRoom = p.rowSpan - orig[i].rowSpan < caps[i].row;
      if (colRoom && colFree(p, p.colStart + p.colSpan)) {
        for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++) set(r, p.colStart + p.colSpan);
        p.colSpan++;
        changed = true;
      } else if (colRoom && colFree(p, p.colStart - 1)) {
        p.colStart--;
        for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++) set(r, p.colStart);
        p.colSpan++;
        changed = true;
      } else if (rowRoom && rowFree(p, p.rowStart + p.rowSpan)) {
        for (let c = p.colStart; c < p.colStart + p.colSpan; c++) set(p.rowStart + p.rowSpan, c);
        p.rowSpan++;
        changed = true;
      } else if (rowRoom && rowFree(p, p.rowStart - 1)) {
        p.rowStart--;
        for (let c = p.colStart; c < p.colStart + p.colSpan; c++) set(p.rowStart, c);
        p.rowSpan++;
        changed = true;
      }
    }
  }
  return out;
};

/**
 * Merge the empty cells left after {@link fillDeadZones} into unified rectangular blocks — so
 * `fillComponent` renders one wide/tall tile per gap instead of a 1×1 tile per cell. Greedy scan,
 * top-left to bottom-right: each uncovered empty cell grows as wide as the row allows, then as tall
 * as that full width stays empty. Not the minimal rectangle count, but deterministic and always
 * gap-free/overlap-free — good enough for a filler tile, which has no identity to preserve.
 */
export const groupEmptyRects = (occupied: boolean[][], nrCols: number, nrRows: number): Placement[] => {
  const covered: boolean[][] = Array.from({ length: nrRows }, () => new Array(nrCols).fill(false));
  const rects: Placement[] = [];

  for (let r = 0; r < nrRows; r++) {
    for (let c = 0; c < nrCols; c++) {
      if (occupied[r]?.[c] || covered[r][c]) continue;

      let w = 1;
      while (c + w < nrCols && !occupied[r]?.[c + w] && !covered[r][c + w]) w++;

      let h = 1;
      grow: while (r + h < nrRows) {
        for (let cc = c; cc < c + w; cc++) if (occupied[r + h]?.[cc] || covered[r + h][cc]) break grow;
        h++;
      }

      for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) covered[rr][cc] = true;
      rects.push({ colStart: c, rowStart: r, colSpan: w, rowSpan: h });
    }
  }

  return rects;
};
