import { describe, expect, test } from 'bun:test';
import {
  analyzeDevGrid,
  analyzeItems,
  analyzeItemsFilled,
  analyzeSpans,
  devItems,
  showcaseItems,
} from '../scripts/dev-report-grid';

const s = (colSpan: number, rowSpan: number) => ({ colSpan, rowSpan });

describe('analyzeSpans', () => {
  test('a perfectly tiled row has zero dead space', () => {
    const r = analyzeSpans(
      Array.from({ length: 12 }, () => s(1, 1)),
      12,
    );
    expect(r.rows).toBe(1);
    expect(r.dead).toBe(0);
    expect(r.deadPct).toBe(0);
    expect(r.badness).toBe(0);
    expect(r.map).toBe('############');
  });

  test('widths that never reach the column count leave a trailing dead strip', () => {
    // 3 + 2 + 2 + 2 + 2 = 11 in a 12-wide grid → column 12 dies.
    const r = analyzeSpans([s(3, 1), s(2, 1), s(2, 1), s(2, 1), s(2, 1)], 12);
    expect(r.dead).toBe(1);
    expect(r.map.endsWith('.')).toBe(true);
  });

  test('badness squares per-row dead: one big hole scores worse than two small ones', () => {
    const oneBig = analyzeSpans([s(10, 1)], 12); // one row, dead 2 → badness 4
    const twoSmall = analyzeSpans([s(11, 1), s(11, 1)], 12); // two rows, dead 1 each → badness 2
    expect(oneBig.badness).toBe(4);
    expect(twoSmall.badness).toBe(2);
    expect(oneBig.badness).toBeGreaterThan(twoSmall.badness);
  });

  test('empty input reports a fully dead single row', () => {
    const r = analyzeSpans([], 6);
    expect(r.rows).toBe(1);
    expect(r.dead).toBe(6);
    expect(r.deadPct).toBe(100);
  });
});

describe('Showcase QA baseline (verbatim weightForIndex grid)', () => {
  // Anchors the real desktop layout so improvements are visible. When the engine gets smarter,
  // update these numbers deliberately — a drop is the whole point.
  test('raw order-mode layout has the dead zones we saw in QA', () => {
    const r = analyzeItems(showcaseItems(), 12);
    expect(r.rows).toBe(13); // weight-4 items are 4×4, so the grid runs tall
    expect(r.dead).toBe(30);
    expect(r.badness).toBe(106);
    // Sanity: reported dead equals the map's '.' count.
    expect(r.dead).toBe((r.map.match(/\./g) ?? []).length);
  });

  test('4-directional fill collapses the obvious gaps; the cap trades fill for gentleness', () => {
    const raw = analyzeItems(showcaseItems(), 12);
    const cap1 = analyzeItemsFilled(showcaseItems(), 12, 1);
    const cap2 = analyzeItemsFilled(showcaseItems(), 12, 2);
    const full = analyzeItemsFilled(showcaseItems(), 12, Number.POSITIVE_INFINITY);

    // The fill only grows existing items — never reflows into new rows.
    for (const r of [cap1, cap2, full]) expect(r.rows).toBe(raw.rows);

    // Monotonic: a looser cap fills at least as much.
    expect(cap1.dead).toBeLessThan(raw.dead);
    expect(cap2.dead).toBeLessThanOrEqual(cap1.dead);
    expect(full.dead).toBeLessThanOrEqual(cap2.dead);

    // Baseline anchors (see `bun scripts/dead-zones.ts`).
    expect(raw.dead).toBe(30); // 19%
    expect(cap1.dead).toBe(17); // 11%
    expect(cap2.dead).toBe(13); // 8%
    expect(full.dead).toBe(9); // 6% — remainder are 1–2 cell "eyes" beside the fixed VoidTiles
    expect(full.badness).toBe(17);
  });
});

describe('analyzeDevGrid — combined stretch + fillComponent', () => {
  // dev/src/App.jsx renders with nrCols=10, stretch={4} AND fillComponent: stretch runs first
  // (capped at 4, per-axis elastic), fillComponent only plugs what that cap couldn't reach. Anchors
  // the real dev config — the trailing 5×5 fully-strict item (`{ cols: 5, rows: 5 }`, last in CARDS)
  // and the fully-strict weight-ignoring items (idx 12–15) are expected to leave a few real,
  // isolated stuck holes.
  test('a stretch cap matching the live prop leaves only genuinely stuck cells, no missed-stretch', () => {
    const r = analyzeDevGrid(devItems(), 10, 4);
    expect(r.holes.length).toBe(4);
    expect(r.holes.every((h) => h.kind === 'stuck')).toBe(true);
  });

  test('stretch=0 pushes strictly more onto fillComponent than the live stretch=4', () => {
    const noStretch = analyzeDevGrid(devItems(), 10, 0);
    const withStretch = analyzeDevGrid(devItems(), 10, 4);
    expect(noStretch.holes.length).toBeGreaterThan(withStretch.holes.length);
  });

  test('an uncapped stretch never does worse than the capped live config', () => {
    const withStretch = analyzeDevGrid(devItems(), 10, 4);
    const uncapped = analyzeDevGrid(devItems(), 10, Number.POSITIVE_INFINITY);
    expect(uncapped.holes.length).toBeLessThanOrEqual(withStretch.holes.length);
  });

  test('an explicit minRows floor never shrinks below what content already needs', () => {
    // cols=10 needs 14 rows for these 18 items — a smaller minRows is a no-op, a larger one adds
    // headroom without changing where anything currently sits.
    const auto = analyzeDevGrid(devItems(), 10, 4, 0);
    const smallerFloor = analyzeDevGrid(devItems(), 10, 4, 5);
    const biggerFloor = analyzeDevGrid(devItems(), 10, 4, 20);
    expect(smallerFloor.rows).toBe(auto.rows);
    expect(biggerFloor.rows).toBe(20);
  });
});
