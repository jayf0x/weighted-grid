import { describe, expect, test } from 'bun:test';
import { fillDeadZones, type Placement, packedRowCount, spanFor, stretchCapsOf } from '../src/utils';

const s = (colSpan: number, rowSpan: number) => ({ colSpan, rowSpan });

describe('packedRowCount', () => {
  test('1x1 items wrap by column count', () => {
    expect(packedRowCount([s(1, 1)], 12, false)).toBe(1);
    expect(
      packedRowCount(
        Array.from({ length: 5 }, () => s(1, 1)),
        12,
        false,
      ),
    ).toBe(1);
    expect(
      packedRowCount(
        Array.from({ length: 14 }, () => s(1, 1)),
        12,
        false,
      ),
    ).toBe(2);
  });

  test('a tall/wide span pushes the row count', () => {
    expect(packedRowCount([s(2, 2), s(1, 1), s(1, 1), s(1, 1)], 4, false)).toBe(2);
  });

  test('dense back-fills the gaps a big span leaves, not adding phantom rows', () => {
    const spans = [s(2, 2), ...Array.from({ length: 6 }, () => s(1, 1))];
    expect(packedRowCount(spans, 4, true)).toBe(3);
  });

  test('never returns 0', () => {
    expect(packedRowCount([], 4, false)).toBe(1);
  });
});

describe('spanFor', () => {
  test('weight sizes both axes equally — equal weights are equal squares', () => {
    expect(spanFor({}, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
    expect(spanFor({ weight: 2 }, 6)).toEqual({ colSpan: 2, rowSpan: 2 });
    expect(spanFor({ weight: 3 }, 6)).toEqual({ colSpan: 3, rowSpan: 3 });
  });

  test('cols/rows override weight per-axis (no overloading)', () => {
    expect(spanFor({ cols: 3, rows: 2, weight: 99 }, 6)).toEqual({ colSpan: 3, rowSpan: 2 });
    // cols overrides only the horizontal axis; weight still drives the vertical.
    expect(spanFor({ cols: 4, weight: 2 }, 6)).toEqual({ colSpan: 4, rowSpan: 2 });
    expect(spanFor({ rows: 5, weight: 2 }, 6)).toEqual({ colSpan: 2, rowSpan: 5 });
  });

  test('a lone pin leaves the other axis at 1 (weight defaults to 1)', () => {
    expect(spanFor({ cols: 3 }, 6)).toEqual({ colSpan: 3, rowSpan: 1 });
    expect(spanFor({ rows: 2 }, 6)).toEqual({ colSpan: 1, rowSpan: 2 });
  });

  test('colSpan is clamped to the available columns', () => {
    expect(spanFor({ cols: 99 }, 6).colSpan).toBe(6);
    expect(spanFor({ weight: 99 }, 6).colSpan).toBe(6);
  });

  test('non-positive / missing weight falls back to 1', () => {
    expect(spanFor({ weight: 0 }, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
    expect(spanFor({ weight: -3 }, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
  });
});

describe('fillDeadZones — fair round-robin growth', () => {
  const at = (colStart: number): Placement => ({ colStart, rowStart: 0, colSpan: 1, rowSpan: 1 });
  const inf = Number.POSITIVE_INFINITY;
  const both = { col: inf, row: inf };
  const rowOnly = { col: 0, row: inf }; // e.g. a `cols`-pinned item: col fixed, row weight-driven
  const none = { col: 0, row: 0 };

  test('two elastic items flanking a gap share it (3/2), not first-eats-all (4/1)', () => {
    // cols=5, one row: item A at col0, item B at col4, gap = cols 1,2,3. Both border it.
    const out = fillDeadZones([at(0), at(4)], [both, both], 5, 1);
    // Round-robin: A grows to 3 wide (cols0-2), B to 2 wide (cols3-4). Greedy would give 4/1.
    expect(out.map((p) => p.colSpan)).toEqual([3, 2]);
    // Gap-free, no overlap: the two spans tile all 5 columns exactly once.
    const covered = new Array(5).fill(0);
    for (const p of out) for (let c = p.colStart; c < p.colStart + p.colSpan; c++) covered[c]++;
    expect(covered).toEqual([1, 1, 1, 1, 1]);
  });

  test('fixed (0-cap) items never grow', () => {
    const out = fillDeadZones([at(0), at(4)], [none, both], 5, 1);
    expect(out[0].colSpan).toBe(1); // fixed stays put
    expect(out[1].colSpan).toBe(4); // elastic absorbs the whole gap
  });

  test('a numeric cap limits growth per axis', () => {
    const out = fillDeadZones([at(0), at(4)], [{ col: 1, row: 1 }, { col: 1, row: 1 }], 5, 1);
    // Each may gain at most 1 cell → A 2 wide, B 2 wide, one column stays dead.
    expect(out.map((p) => p.colSpan)).toEqual([2, 2]);
  });

  test('an item pinned on one axis can still grow on the other (per-axis cap)', () => {
    // A is col-pinned (cap 0) but row-elastic (cap Infinity); give it 2 rows of headroom below in a
    // 1-wide grid.
    const a: Placement = { colStart: 0, rowStart: 0, colSpan: 1, rowSpan: 1 };
    const out = fillDeadZones([a], [rowOnly], 1, 3);
    expect(out[0].colSpan).toBe(1); // col axis capped at 0, never grows
    expect(out[0].rowSpan).toBe(3); // row axis still weight-driven, absorbs the dead rows below
  });
});

describe('stretchCapsOf — per-item stretch overrides', () => {
  test('weight-driven axis defaults to the grid stretch; pinned axis defaults to 0', () => {
    expect(stretchCapsOf({}, 4)).toEqual({ col: 4, row: 4 });
    expect(stretchCapsOf({ cols: 2 }, 4)).toEqual({ col: 0, row: 4 });
    expect(stretchCapsOf({ cols: 2, rows: 2 }, 4)).toEqual({ col: 0, row: 0 });
  });

  test('`stretch` lets a pinned axis grow a little, without unpinning it', () => {
    expect(stretchCapsOf({ cols: 2, rows: 2, stretch: 1 }, 4)).toEqual({ col: 1, row: 1 });
  });

  test('`stretch` can also cap a weight-driven axis below the grid default', () => {
    expect(stretchCapsOf({ stretch: 1 }, Number.POSITIVE_INFINITY)).toEqual({ col: 1, row: 1 });
  });

  test('`stretchX`/`stretchY` override `stretch` per axis', () => {
    expect(stretchCapsOf({ cols: 2, rows: 2, stretch: 1, stretchX: 3 }, 4)).toEqual({ col: 3, row: 1 });
    expect(stretchCapsOf({ stretchY: 0 }, 4)).toEqual({ col: 4, row: 0 });
  });
});
