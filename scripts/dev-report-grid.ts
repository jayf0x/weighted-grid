/**
 * Grid QA harness — dead-zone analyzer + per-case report for `dev/src/cases`.
 *
 * Runs against the placement *model* (`placeSpans`) rather than a real browser — no puppeteer, no
 * deps, deterministic, and importable straight into a test. The grid owns placement with explicit
 * `grid-column`/`grid-row` lines (see `src/react.tsx`), so this model equals what the DOM renders
 * pixel-for-pixel; there's nothing a `div[role=grid]` + `getBoundingClientRect()` walk in devtools
 * would tell you that this script doesn't already know, and this one runs without a browser.
 *
 * Every dev case (`dev/src/cases/*.ts`) is plain data — a `Case` of `{ title, meta, tiles }`, no
 * JSX — so this script imports the exact same array the dev app renders. There is one source of
 * truth per case; nothing here can drift from what's on screen.
 *
 * Run:   bun scripts/dev-report-grid.ts               # every dev case
 *        bun scripts/dev-report-grid.ts --case=1       # just dev/src/cases[1] ("the 2nd case")
 *        bun scripts/dev-report-grid.ts --stretch=0    # override that case's `stretch` prop
 *        bun scripts/dev-report-grid.ts --showcase     # the old Showcase dead-zone report
 * Import: `analyzeCase`/`formatCaseReport` for a single case, `analyzeItems`/`formatReport` for
 * unit tests (see tests/dev-report-grid.test.ts).
 */

import { cases } from '../dev/src/cases';
import type { Case, CaseTile } from '../dev/src/lib/case';
import type { GridItemProps } from '../src/react';
import {
  fillDeadZones,
  groupEmptyRects,
  type Placement,
  placeSpans,
  type Span,
  spanFor,
  stretchCapsOf,
} from '../src/utils';

export type DeadZoneReport = {
  cols: number;
  rows: number;
  total: number;
  dead: number;
  /** Percentage of grid cells left empty. */
  deadPct: number;
  /** Σ(dead per row)² — squared so one big hole scores worse than several small ones. */
  badness: number;
  perRow: { row: number; used: number; dead: number }[];
  /** ASCII occupancy map: `#` = filled, `.` = dead. */
  map: string;
};

/** Build a report from a resolved occupancy grid — shared by the raw and dead-zone-filled paths. */
const reportFromOccupancy = (occupancy: boolean[][], cols: number, rows: number): DeadZoneReport => {
  const perRow: DeadZoneReport['perRow'] = [];
  const mapLines: string[] = [];
  let dead = 0;
  let badness = 0;

  for (let r = 0; r < rows; r++) {
    const line = occupancy[r] ?? new Array(cols).fill(false);
    const used = line.reduce((s, b) => s + (b ? 1 : 0), 0);
    const d = cols - used;
    dead += d;
    badness += d * d;
    perRow.push({ row: r, used, dead: d });
    mapLines.push(line.map((b) => (b ? '#' : '.')).join(''));
  }

  const total = rows * cols;
  return {
    cols,
    rows,
    total,
    dead,
    deadPct: total ? (100 * dead) / total : 0,
    badness,
    perRow,
    map: mapLines.join('\n'),
  };
};

export const analyzeSpans = (spans: Span[], cols: number, isPacked = false): DeadZoneReport => {
  const { occupancy, rows } = placeSpans(spans, cols, isPacked);
  return reportFromOccupancy(occupancy, cols, rows);
};

/** Rebuild an occupancy grid from explicit placements (used to measure the post-fill layout). */
const occupancyOf = (placements: Placement[], cols: number, rows: number): boolean[][] => {
  const occ = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
  for (const p of placements)
    for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
      for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r]?.[c] === false) occ[r][c] = true;
  return occ;
};

/** Convenience: analyze a list of `<GridItem>`-style props (uses the real `spanFor`). */
export const analyzeItems = (items: GridItemProps[], cols: number, isPacked = false): DeadZoneReport =>
  analyzeSpans(
    items.map((p) => spanFor(p, cols)),
    cols,
    isPacked,
  );

/** Analyze the same items *after* the order-mode dead-zone fill — what `<Grid mode="order">` renders.
 * `maxStretch` matches the `stretch` prop (extra cells per axis an elastic item may grow). */
export const analyzeItemsFilled = (
  items: GridItemProps[],
  cols: number,
  maxStretch = Number.POSITIVE_INFINITY,
): DeadZoneReport => {
  const { placements, rows } = placeSpans(
    items.map((p) => spanFor(p, cols)),
    cols,
    false,
  );
  const filled = fillDeadZones(
    placements,
    items.map((p) => stretchCapsOf(p, maxStretch)),
    cols,
    rows,
  );
  return reportFromOccupancy(occupancyOf(filled, cols, rows), cols, rows);
};

export const formatReport = (report: DeadZoneReport, title = 'dead-zone report'): string => {
  const { cols, rows, dead, total, deadPct, badness, map } = report;
  return [
    `── ${title} (cols=${cols}) ──`,
    map,
    `rows=${rows}  dead=${dead}/${total} cells (${deadPct.toFixed(0)}% empty)  badness(Σdead²)=${badness}`,
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────────────────
// Live Showcase config — a *verbatim* copy of the desktop grid in
// ../jayf0x.github.io/src/pages/Home/Showcase/index.tsx (`weightForIndex` + `emptyTiles`), so this
// harness and the real page lay out identically. Every content item is weight-only (elastic); the
// three `emptyTiles` are fixed `isEmpty` VoidTiles (intentional negative space). Keep in sync.
// ─────────────────────────────────────────────────────────────────────────────
const weightForIndex = (i: number): number => {
  if (i === 0) return 3;
  const x = Math.sin(i * 12.9898) * 43758.5453;
  const r = x - Math.floor(x);
  if (r < 0.15) return 3;
  if (r < 0.55) return 2;
  return 4;
};

const emptyTiles = [
  { at: 3, cols: 2, rows: 2 },
  { at: 6, cols: 1, rows: 2 },
  { at: 10, cols: 2, rows: 1 },
];

/** The exact item stream the desktop Showcase renders (repos + woven-in VoidTiles, in order). */
export const showcaseItems = (count = 12): GridItemProps[] => {
  const items: GridItemProps[] = [];
  for (let i = 0; i < count; i++) {
    const empty = emptyTiles.find((e) => e.at === i);
    if (empty) items.push({ cols: empty.cols, rows: empty.rows });
    items.push({ weight: weightForIndex(i) });
  }
  return items;
};

// ─────────────────────────────────────────────────────────────────────────────
// dev/src/cases — the actual dev QA cases. `devItems()` stays as the flat GridItemProps view of
// `dev/src/cases/1-default.ts` (`cases[0]`) for the pre-existing unit-test baselines below; every
// case (including ones with `void` tiles, like the organic mosaic) goes through `analyzeCase`.
// ─────────────────────────────────────────────────────────────────────────────
export const devItems = (): GridItemProps[] =>
  cases[0].tiles.filter((t) => t.kind === 'item').map(({ kind, ...props }) => props);

export type HoleKind = 'stuck' | 'missed-stretch';

export type CaseReport = {
  title: string;
  cols: number;
  rows: number;
  stretch: number;
  tileCount: number;
  /** ASCII map: `#`=item/void, `~`=hole a neighbor could've stretched into, `.`=hole nothing can reach. */
  map: string;
  holes: { row: number; col: number; kind: HoleKind }[];
  /** The actual `fillComponent` tiles the grid renders — holes merged into unified rectangular
   * blocks (see {@link groupEmptyRects}), exactly as `src/react.tsx` does. */
  fillerTiles: { row: number; col: number; rowSpan: number; colSpan: number }[];
};

const asGridItemProps = (tiles: CaseTile[]): GridItemProps[] => tiles.map(({ kind, ...props }) => props);

/**
 * Reports on one `Case` as it's actually rendered: `stretch` (from `meta.stretch`, default
 * `Infinity` to match the `<Grid>` default) runs first, then whatever's still empty is where
 * `fillComponent` lands. For every cell the *rendered* grid leaves empty, checks whether an
 * uncapped `fillDeadZones` would have closed it — that's a **missed-stretch** cell, the spot to
 * point an agent at when raising `stretch` would shrink filler-tile usage. What's left over even at
 * infinite stretch is **stuck** — no elastic neighbor can reach it (boxed in by other holes, strict
 * items, or the grid edge); `fillComponent` is the only thing that can plug it.
 */
export const analyzeCase = (
  { title, meta, tiles }: Case,
  overrides: { cols?: number; stretch?: number } = {},
): CaseReport => {
  const cols = overrides.cols ?? meta.nrCols ?? 7;
  const stretch = overrides.stretch ?? meta.stretch ?? Number.POSITIVE_INFINITY;
  const items = asGridItemProps(tiles);

  const spans = items.map((p) => spanFor(p, cols));
  const { placements, rows: contentRows } = placeSpans(spans, cols, false);
  // `nrRows` is a floor, not a cap — see `src/react.tsx`'s `rowCount`. Mirror that here.
  const rows = Math.max(meta.nrRows ?? 0, contentRows);
  const renderedCaps = items.map((p) => stretchCapsOf(p, stretch));
  const uncappedCaps = items.map((p) => stretchCapsOf(p, Number.POSITIVE_INFINITY));
  const renderedOcc = occupancyOf(fillDeadZones(placements, renderedCaps, cols, rows), cols, rows);
  const stretchedOcc = occupancyOf(fillDeadZones(placements, uncappedCaps, cols, rows), cols, rows);

  const holes: CaseReport['holes'] = [];
  const mapLines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      if (renderedOcc[r]?.[c]) {
        line += '#';
        continue;
      }
      const closable = stretchedOcc[r]?.[c] ?? false;
      holes.push({ row: r, col: c, kind: closable ? 'missed-stretch' : 'stuck' });
      line += closable ? '~' : '.';
    }
    mapLines.push(line);
  }

  const fillerTiles = groupEmptyRects(renderedOcc, cols, rows).map((p) => ({
    row: p.rowStart,
    col: p.colStart,
    rowSpan: p.rowSpan,
    colSpan: p.colSpan,
  }));

  return { title, cols, rows, stretch, tileCount: tiles.length, map: mapLines.join('\n'), holes, fillerTiles };
};

/** Back-compat shim over `analyzeCase` for the `devItems()`-shaped unit tests below — same 4-arg
 * shape (`items, cols, maxStretch, minRows`) the tests already anchor on. */
export const analyzeDevGrid = (
  items: GridItemProps[] = devItems(),
  cols = 10,
  maxStretch = 4,
  minRows = 0,
): CaseReport =>
  analyzeCase(
    {
      title: 'devItems',
      meta: { nrCols: cols, stretch: maxStretch, nrRows: minRows },
      tiles: items.map((p) => ({ kind: 'item', ...p })),
    },
    {},
  );

export const formatCaseReport = (report: CaseReport): string => {
  const { title, cols, rows, stretch, tileCount, map, holes, fillerTiles } = report;
  const stuck = holes.filter((h) => h.kind === 'stuck');
  const missed = holes.filter((h) => h.kind === 'missed-stretch');
  const lines = [
    `── ${title} (cols=${cols}, rows=${rows}, stretch=${stretch}, tiles=${tileCount}) ──`,
    map,
    `holes: ${holes.length}  stuck: ${stuck.length}  missed-stretch: ${missed.length}`,
  ];
  if (missed.length) lines.push(`  missed-stretch at (row,col): ${missed.map((h) => `(${h.row},${h.col})`).join(' ')}`);
  if (fillerTiles.length) {
    lines.push(
      `fillComponent renders ${fillerTiles.length} tile${fillerTiles.length === 1 ? '' : 's'} (merged, not one per cell):`,
    );
    for (const f of fillerTiles) lines.push(`  row ${f.row}, col ${f.col} — ${f.colSpan}×${f.rowSpan}`);
  }
  return lines.join('\n');
};

/** @deprecated kept only for the pre-existing unit-test baselines; use `formatCaseReport`. */
export const formatDevReport = formatCaseReport;

if (import.meta.main) {
  const caseArg = process.argv.find((a) => a.startsWith('--case='));
  const colsArg = process.argv.find((a) => a.startsWith('--cols='));
  const stretchArg = process.argv.find((a) => a.startsWith('--stretch='));
  const overrides = {
    cols: colsArg ? Number(colsArg.split('=')[1]) : undefined,
    stretch: stretchArg ? Number(stretchArg.split('=')[1]) : undefined,
  };

  if (process.argv.includes('--showcase')) {
    const cols = overrides.cols ?? 12;
    const items = showcaseItems();
    console.log(formatReport(analyzeItems(items, cols), `Showcase order-mode (raw)`));
    for (const cap of [1, 2, Number.POSITIVE_INFINITY]) {
      console.log();
      console.log(formatReport(analyzeItemsFilled(items, cols, cap), `order-mode fill (stretch=${cap})`));
    }
  } else {
    const selected = caseArg ? [cases[Number(caseArg.split('=')[1])]] : cases;
    for (const [i, c] of selected.entries()) {
      if (!c) {
        console.error(`no such case: ${caseArg}`);
        process.exit(1);
      }
      if (i > 0) console.log();
      console.log(formatCaseReport(analyzeCase(c, overrides)));
    }
  }
}
