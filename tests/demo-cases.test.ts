import { describe, expect, test } from 'bun:test';
import { mosaicCounts } from '../demo/src/showcases/pinning/centre';
import { computeLayout } from '../src/core';

/* The demo has exactly one case whose layout is arithmetic rather than data: `pinning` centres a
 * pinned block by counting the single-cell tiles that go before it. Checked here against the real
 * engine, because "the block drifted one cell off centre" is invisible in a screenshot and obvious
 * on the page. The plain-data cases are covered by `dev-report-grid.test.ts` instead. */

const PIN = { cols: 4, rows: 3 };

const layoutOf = (nrCols: number, nrRows: number, cols: number, rows: number) => {
  const { before, after } = mosaicCounts(nrCols, nrRows, cols, rows);
  const items = [
    ...Array.from({ length: before }, () => ({ weight: 1 })),
    { cols, rows },
    ...Array.from({ length: after }, () => ({ weight: 1 })),
  ];
  return { before, layout: computeLayout(items, { nrCols, nrRows, stretch: 0 }) };
};

describe('pinning case — centred block', () => {
  for (let nrCols = 6; nrCols <= 14; nrCols++) {
    for (const nrRows of [5, 8, 11]) {
      test(`${nrCols}×${nrRows}: block is centred and the mosaic leaves no gap`, () => {
        const { before, layout } = layoutOf(nrCols, nrRows, PIN.cols, PIN.rows);
        const block = layout.placements[before];

        expect(block.colSpan).toBe(PIN.cols);
        expect(block.rowSpan).toBe(PIN.rows);
        // dead centre, to within the odd cell an odd remainder can't split
        expect(nrCols - PIN.cols - 2 * block.colStart).toBeLessThanOrEqual(1);
        expect(nrRows - PIN.rows - 2 * block.rowStart).toBeLessThanOrEqual(1);
        expect(layout.rowCount).toBe(nrRows);
        expect(layout.fillerRects).toEqual([]);
      });
    }
  }

  test('the weight variant is a square of the same width, and still fills the grid', () => {
    const { before, layout } = layoutOf(12, 9, PIN.cols, PIN.cols);
    expect(layout.placements[before]).toMatchObject({ colSpan: 4, rowSpan: 4 });
    expect(layout.fillerRects).toEqual([]);
  });
});
