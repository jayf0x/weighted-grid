import type { GridItemProps, GridProps } from 'weighted-grid/react';

/* ─────────────────────────────────────────────────────────────────────────────
   Plain-data plates.

   Two plates are *reference* layouts rather than toys — the exhaustive prop
   matrix and the pinned-span grid. Their tiles are data, not JSX, so
   `scripts/dev/dev-report-grid.ts` can analyze exactly what the page renders
   without a browser, and the QA baselines in `tests/dev-report-grid.test.ts`
   keep meaning the same thing. One definition per layout, two consumers.
   ───────────────────────────────────────────────────────────────────────────── */

/** One tile: `kind` picks the visual, everything else goes straight to `<GridItem>`. */
export type ReportTile = { kind?: 'item' | 'void' } & GridItemProps;

/** The `<Grid>` props a data plate declares. Everything else is fixed by the plate. */
export type ReportMeta = Partial<Pick<GridProps, 'nrCols' | 'nrRows' | 'rowHeight' | 'gap' | 'stretch' | 'showGrid'>>;

export type ReportCase = { title: string; meta: ReportMeta; tiles: ReportTile[] };

/** Exhaustive weight/cols/rows/strict matrix — every combination of pinned and elastic axes side
 * by side. Tile data is unchanged from the original QA case so the baselines still anchor. */
export const propMatrix: ReportCase = {
  title: 'prop matrix — weight / cols / rows / strict',
  meta: { nrCols: 10, gap: 5, stretch: 4 },
  tiles: [
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 2 },
    { kind: 'item', weight: 3 },
    { kind: 'item', weight: 4 },
    // pinned cols
    { kind: 'item', weight: 1, cols: 1 },
    { kind: 'item', weight: 2, cols: 1 },
    { kind: 'item', weight: 3, cols: 2 },
    { kind: 'item', weight: 4, cols: 2 },
    // pinned rows
    { kind: 'item', weight: 1, rows: 1 },
    { kind: 'item', weight: 2, rows: 1 },
    { kind: 'item', weight: 3, rows: 2 },
    { kind: 'item', weight: 4, rows: 2 },
    // both pinned — weight has no effect
    { kind: 'item', weight: 10, cols: 1, rows: 1 },
    { kind: 'item', weight: 20, cols: 1, rows: 1 },
    { kind: 'item', weight: 30, cols: 2, rows: 2 },
    { kind: 'item', weight: 40, cols: 2, rows: 2 },
    { kind: 'item', weight: 4 },
    { kind: 'item', cols: 5, rows: 5 },
  ],
};

/** The default span grid: exact `cols`/`rows` spans mixed with plain weighted squares, so the
 * dead-zone pass has something real to work on. */
export const pinnedSpans: ReportCase = {
  title: 'span grid — exact cols/rows mixed with weighted squares',
  meta: { nrCols: 6, gap: 6 },
  tiles: [
    { kind: 'item', cols: 3, rows: 2 },
    { kind: 'item', cols: 2 },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
  ],
};

/** Every data plate, in plate order — the array `scripts/dev/dev-report-grid.ts` addresses with
 * `--case=N`. */
export const reportCases: ReportCase[] = [propMatrix, pinnedSpans];
