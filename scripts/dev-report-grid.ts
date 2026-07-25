/**
 * Grid QA harness — dead-zone analyzer + dev/App.jsx report.
 *
 * Runs against the placement *model* (`placeSpans`) rather than a real browser — no puppeteer, no
 * deps, deterministic, and importable straight into a test. The grid owns placement with explicit
 * `grid-column`/`grid-row` lines (see `src/react.tsx`), so this model equals what the DOM renders
 * pixel-for-pixel; there's nothing a `div[role=grid]` + `getBoundingClientRect()` walk in devtools
 * would tell you that this script doesn't already know, and this one runs without a browser.
 *
 * Run:   bun scripts/dev-report-grid.ts               # holes/stretch/filler-repeats for dev/src/App.jsx
 *        bun scripts/dev-report-grid.ts --cols=8      # override the column count
 *        bun scripts/dev-report-grid.ts --stretch=5   # override the stretch cap (matches the Grid prop)
 *        bun scripts/dev-report-grid.ts --showcase    # the old Showcase dead-zone report
 * Import: `analyzeDevGrid`/`formatDevReport` for the dev report, `analyzeSpans`/`formatReport` for
 * unit tests (see tests/dev-report-grid.test.ts).
 */
import { placeSpans, spanFor, fillDeadZones, elasticityOf, groupEmptyRects, type Placement, type Span } from '../src/utils';
import type { GridItemProps } from '../src/react';

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
  analyzeSpans(items.map((p) => spanFor(p, cols)), cols, isPacked);

/** Analyze the same items *after* the order-mode dead-zone fill — what `<Grid mode="order">` renders.
 * `maxStretch` matches the `stretch` prop (extra cells per axis an elastic item may grow). */
export const analyzeItemsFilled = (
  items: GridItemProps[],
  cols: number,
  maxStretch = Number.POSITIVE_INFINITY,
): DeadZoneReport => {
  const { placements, rows } = placeSpans(items.map((p) => spanFor(p, cols)), cols, false);
  const filled = fillDeadZones(placements, items.map(elasticityOf), cols, rows, maxStretch);
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
// dev/src/App.jsx config — a *verbatim* copy of `CARDS` in dev/src/App.jsx: weight-only items, items
// with one axis pinned (`cols` xor `rows`), and items with both pinned (fully strict). Keep in sync.
// ─────────────────────────────────────────────────────────────────────────────
export const devItems = (): GridItemProps[] => [
  { weight: 1 },
  { weight: 2 },
  { weight: 3 },
  { weight: 4 },
  // fixed cols
  { weight: 1, cols: 1 },
  { weight: 2, cols: 1 },
  { weight: 3, cols: 2 },
  { weight: 4, cols: 2 },
  // fixed rows
  { weight: 1, rows: 1 },
  { weight: 2, rows: 1 },
  { weight: 3, rows: 2 },
  { weight: 4, rows: 2 },
  // fixed cols and rows — weight should not have any effect
  { weight: 10, cols: 1, rows: 1 },
  { weight: 20, cols: 1, rows: 1 },
  { weight: 30, cols: 2, rows: 2 },
  { weight: 40, cols: 2, rows: 2 },
  // could be largest, depending on others
  { weight: 4 },
  // should be largest
  { cols: 5, rows: 5 },
];

export type HoleKind = 'stuck' | 'missed-stretch';

export type DevGridReport = {
  cols: number;
  rows: number;
  /** ASCII map: `#`=item, `~`=hole a neighbor could've stretched into, `.`=hole nothing can reach. */
  map: string;
  holes: { row: number; col: number; kind: HoleKind }[];
  /** The actual `fillComponent` tiles the grid renders — holes merged into unified rectangular
   * blocks (see {@link groupEmptyRects}), exactly as `src/react.tsx` does. */
  fillerTiles: { row: number; col: number; rowSpan: number; colSpan: number }[];
};

/**
 * Reports on the App.jsx config as it's actually rendered: `stretch` (capped at `maxStretch`, matching
 * the live prop) runs first, then whatever's still empty is where `fillComponent` (the `id="filler"`
 * tile) lands. For every cell the *rendered* grid leaves empty, checks whether an uncapped
 * `fillDeadZones` (`maxStretch=Infinity`) would have closed it — that's a **missed-stretch** cell,
 * the spot to point an agent at when raising `stretch` would shrink filler-tile usage. What's left
 * over even at infinite stretch is **stuck** — no elastic neighbor can reach it (boxed in by other
 * holes, strict items, or the grid edge); `fillComponent` is the only thing that can plug it.
 */
export const analyzeDevGrid = (
  items: GridItemProps[] = devItems(),
  cols = 8,
  maxStretch = 4,
  minRows = cols, // dev/src/App.jsx passes `rows={nrCols}` — same value as `cols`
): DevGridReport => {
  const spans = items.map((p) => spanFor(p, cols));
  const { placements, rows: contentRows } = placeSpans(spans, cols, false);
  // `rows` is a floor, not a cap — see `src/react.tsx`'s `rowCount`. Mirror that here so this report
  // stays accurate for configs where the declared `rows` is smaller than what content needs.
  const rows = Math.max(minRows, contentRows);
  const isElastic = items.map(elasticityOf);
  const renderedOcc = occupancyOf(fillDeadZones(placements, isElastic, cols, rows, maxStretch), cols, rows);
  const stretchedOcc = occupancyOf(
    fillDeadZones(placements, isElastic, cols, rows, Number.POSITIVE_INFINITY),
    cols,
    rows,
  );

  const holes: DevGridReport['holes'] = [];
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

  return { cols, rows, map: mapLines.join('\n'), holes, fillerTiles };
};

export const formatDevReport = (report: DevGridReport, title = 'dev/App.jsx grid report'): string => {
  const { cols, rows, map, holes, fillerTiles } = report;
  const stuck = holes.filter((h) => h.kind === 'stuck');
  const missed = holes.filter((h) => h.kind === 'missed-stretch');
  const lines = [
    `── ${title} (cols=${cols}, rows=${rows}) ──`,
    map,
    `holes: ${holes.length}  stuck: ${stuck.length}  missed-stretch: ${missed.length}`,
  ];
  if (missed.length) lines.push(`  missed-stretch at (row,col): ${missed.map((h) => `(${h.row},${h.col})`).join(' ')}`);
  if (fillerTiles.length) {
    lines.push(`fillComponent renders ${fillerTiles.length} tile${fillerTiles.length === 1 ? '' : 's'} (merged, not one per cell):`);
    for (const f of fillerTiles) lines.push(`  row ${f.row}, col ${f.col} — ${f.colSpan}×${f.rowSpan}`);
  }
  return lines.join('\n');
};

if (import.meta.main) {
  const colsArg = process.argv.find((a) => a.startsWith('--cols='));

  if (process.argv.includes('--showcase')) {
    const cols = colsArg ? Number(colsArg.split('=')[1]) : 12;
    const items = showcaseItems();
    console.log(formatReport(analyzeItems(items, cols), `Showcase order-mode (raw)`));
    for (const cap of [1, 2, Number.POSITIVE_INFINITY]) {
      console.log();
      console.log(formatReport(analyzeItemsFilled(items, cols, cap), `order-mode fill (stretch=${cap})`));
    }
  } else {
    const stretchArg = process.argv.find((a) => a.startsWith('--stretch='));
    const cols = colsArg ? Number(colsArg.split('=')[1]) : 8; // matches dev/src/App.jsx's nrCols
    const maxStretch = stretchArg ? Number(stretchArg.split('=')[1]) : 4; // matches dev/src/App.jsx's stretch prop
    console.log(formatDevReport(analyzeDevGrid(devItems(), cols, maxStretch)));
  }
}
