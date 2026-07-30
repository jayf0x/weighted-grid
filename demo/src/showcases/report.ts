import type { GridItemProps, GridProps } from 'weighted-grid/react';

/* ─────────────────────────────────────────────────────────────────────────────
   Plain-data cases.

   Two cases are *reference* layouts rather than toys — the exhaustive prop
   matrix and the pinned-span grid. Their tiles are data, not JSX, so
   `scripts/dev/dev-report-grid.ts` can analyze exactly what the page renders
   without a browser, and the QA baselines in `tests/dev-report-grid.test.ts`
   keep meaning the same thing. One definition per layout, two consumers.
   ───────────────────────────────────────────────────────────────────────────── */

/** One tile: `kind` picks the visual, everything else goes straight to `<GridItem>`. */
export type ReportTile = { kind?: 'item' | 'void' } & GridItemProps;

/** The `<Grid>` props a data case declares. Everything else is fixed by the case. */
export type ReportMeta = Partial<Pick<GridProps, 'nrCols' | 'nrRows' | 'rowHeight' | 'gap' | 'stretch' | 'showGrid'>>;

export type ReportCase = { title: string; meta: ReportMeta; tiles: ReportTile[] };

/** Exhaustive weight/cols/rows/strict matrix — every combination of pinned and elastic axes side
 * by side. Tile data is unchanged from the original QA case so the baselines still anchor.
 *
 * QA-only: no case renders this any more (an exhaustive matrix turned out to read as a spec sheet,
 * not a demo). It stays because `tests/dev-report-grid.test.ts` anchors its baselines to it and it
 * is still the fastest way to eyeball every prop combination at once — `--case=0`. */
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

/** A span grid with deliberate dead zones: small strict tiles (both axes pinned) boxing in elastic
 * ones, so there is real leftover space for `stretch` to close and for `fillComponent` to plug.
 *
 * Tuned against `bun scripts/dev/dev-report-grid.ts --case=1 --stretch=N` for N across the slider's
 * whole range: every step of the cap has to close *something* it couldn't close one step earlier,
 * or the control is a decoration. That means many small pins rather than a few big ones — a 4×3 pin
 * leaves one enormous hole that either closes at cap 1 or never. */
export const pinnedSpans: ReportCase = {
  title: 'span grid — small strict tiles boxing in elastic ones',
  meta: { nrCols: 12, gap: 6, stretch: 0 },
  tiles: [
    { kind: 'item', weight: 1 },
    { kind: 'item', cols: 1, rows: 1 },
    { kind: 'item', cols: 1, rows: 1 },
    { kind: 'item', weight: 1 },
    { kind: 'item', cols: 2, rows: 2 },
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 1 },
    { kind: 'item', cols: 1, rows: 2 },
    { kind: 'item', cols: 2, rows: 3 },
    { kind: 'item', cols: 1, rows: 1 },
    { kind: 'item', cols: 4, rows: 1 },
    { kind: 'item', weight: 3 },
    { kind: 'item', cols: 3, rows: 1 },
    { kind: 'item', weight: 2 },
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 2 },
    { kind: 'item', cols: 3, rows: 2 },
    { kind: 'item', cols: 2, rows: 1 },
    { kind: 'item', cols: 1, rows: 1 },
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 3 },
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 1 },
    { kind: 'item', weight: 1 },
    { kind: 'item', cols: 1, rows: 2 },
    { kind: 'item', cols: 3, rows: 3 },
  ],
};

/** Every data case, in case order — the array `scripts/dev/dev-report-grid.ts` addresses with
 * `--case=N`. */
export const reportCases: ReportCase[] = [propMatrix, pinnedSpans];
