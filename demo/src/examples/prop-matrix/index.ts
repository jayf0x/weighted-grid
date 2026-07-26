import type { Example } from '@/typing';

/** Exhaustive weight/cols/rows/strict matrix — every combination of pinned/elastic axes side by
 * side, static. Ported verbatim from `dev/src/cases/1-default.ts` (`defaultCase`); tile data is
 * unchanged so `scripts/dev-report-grid.ts`'s existing QA baselines keep meaning the same thing. */
export const propMatrixExample: Example = {
  title: 'prop matrix — weight / cols / rows / strict',
  meta: { nrCols: 10, gap: 5, stretch: 4 },
  tiles: [
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 2 },
    { kind: 'item', weight: 3 },
    { kind: 'item', weight: 4 },
    // fixed cols
    { kind: 'item', weight: 1, cols: 1 },
    { kind: 'item', weight: 2, cols: 1 },
    { kind: 'item', weight: 3, cols: 2 },
    { kind: 'item', weight: 4, cols: 2 },
    // fixed rows
    { kind: 'item', weight: 1, rows: 1 },
    { kind: 'item', weight: 2, rows: 1 },
    { kind: 'item', weight: 3, rows: 2 },
    { kind: 'item', weight: 4, rows: 2 },
    // fixed cols and rows — weight should have no effect
    { kind: 'item', weight: 10, cols: 1, rows: 1 },
    { kind: 'item', weight: 20, cols: 1, rows: 1 },
    { kind: 'item', weight: 30, cols: 2, rows: 2 },
    { kind: 'item', weight: 40, cols: 2, rows: 2 },
    // could be largest, depending on others
    { kind: 'item', weight: 4 },
    // should be largest
    { kind: 'item', cols: 5, rows: 5 },
  ],
};
