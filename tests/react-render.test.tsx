import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { flipTransform, Grid, GridItem } from '../src/react';

// Regression: a user reported <Grid> rendering empty, unweighted cells with a dev-only profiler
// (Million Lint) enabled, which wraps every JSX element in an instrumentation component —
// `<GridItem>` arrived one level down inside `props.children` instead of reaching `Grid` directly.
// `asGridItems` looks one level deep for a real GridItem before giving up.
const Wrapper = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const colSpans = (html: string) => [...html.matchAll(/grid-column:\d+ \/ span (\d+)/g)].map((m) => Number(m[1]));

describe('Grid (SSR render)', () => {
  test('finds a GridItem wrapped one level deep, emits explicit line-based placement', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={12} stretch={0} rowHeight={20} gap={3}>
        <Wrapper>
          <GridItem weight={4}>wrapped</GridItem>
        </Wrapper>
        <GridItem weight={1}>plain</GridItem>
      </Grid>,
    );

    expect(html).toContain('wrapped<');
    expect(html).toContain('plain<');
    // Explicit `{start} / span {n}`, never bare `span n` — the grid owns placement.
    expect(html).toContain('grid-column:1 / span 4');
    expect(html).not.toContain('grid-column:span');
  });

  test('a <Grid> with no props at all still gets every default', () => {
    const html = renderToStaticMarkup(
      <Grid>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
    expect(html).toContain('gap:8px');
  });

  test('weight sizes both axes; cols/rows override per-axis', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={12} stretch={0}>
        <GridItem weight={2}>square</GridItem>
        <GridItem cols={4} rows={2}>
          wide
        </GridItem>
      </Grid>,
    );

    expect(html).toContain('grid-column:1 / span 2;grid-row:1 / span 2');
    expect(html).toContain('grid-column:3 / span 4;grid-row:1 / span 2');
  });

  test('stretch={0} leaves raw source-order spans (no growth)', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={12} stretch={0}>
        <GridItem weight={2}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );
    expect(colSpans(html)).toEqual([2, 2]);
  });

  test('stretch (default ∞) grows weight-only items into the dead columns', () => {
    // Two 2-wide elastic items in 12 cols: raw leaves 8 trailing dead cells; stretch fills the row.
    const html = renderToStaticMarkup(
      <Grid nrCols={12}>
        <GridItem weight={2}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );
    expect(html).toContain('grid-column:1 / span'); // first item pinned to line 1
    expect(colSpans(html).reduce((a, b) => a + b, 0)).toBe(12); // no dead columns
  });

  test('strict items (explicit cols/rows) never stretch; only weight items fill', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={12}>
        <GridItem cols={2} rows={1}>
          fixed
        </GridItem>
        <GridItem weight={1}>elastic</GridItem>
      </Grid>,
    );
    // The fixed 2×1 keeps its span at line 1; the elastic item absorbs the remaining 10 columns.
    expect(html).toContain('grid-column:1 / span 2');
    expect(colSpans(html)).toContain(10);
  });

  test('GridItem stretch lets a pinned axis flex without unpinning it', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={5}>
        <GridItem cols={2} rows={1} stretch={1}>
          fixed
        </GridItem>
      </Grid>,
    );
    // Plain `cols={2}` would freeze at 2 wide, leaving cols 3-5 dead (nothing else to absorb them).
    // stretch={1} lets this cols-pinned axis still grow by 1 cell into the gap, without unpinning it.
    expect(colSpans(html)).toEqual([3]);
  });

  test('GridItem stretchX/stretchY cap growth per axis independently of `stretch`', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={4} nrRows={3} stretch={0}>
        <GridItem cols={1} rows={1} stretch={5} stretchY={0}>
          a
        </GridItem>
      </Grid>,
    );
    // Grid-level stretch=0 would normally freeze everything; item-level stretch=5 overrides that for
    // the column axis (grows to fill all 4), but stretchY=0 overrides `stretch` back down for rows.
    expect(html).toContain('grid-column:1 / span 4;grid-row:1 / span 1');
  });

  test('fillComponent plugs only what stretch (default ∞) leaves — nothing, when one item can fill it all', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={4} nrRows={2} fillComponent={<i>VOID</i>}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    // 4×2 = 8 cells, one elastic item, no cap: it grows to cover the whole grid, so the component
    // never renders — stretch ran first and left nothing to plug.
    expect(html).toContain('a<');
    expect(colSpans(html)).toContain(4);
    expect(html).not.toContain('VOID');
  });

  test('fillComponent plugs exactly what a capped stretch could not reach, as one unified block', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={4} nrRows={2} stretch={1} fillComponent={<i>VOID</i>}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    // stretch=1 grows `a` from 1×1 to 2×2 (one step per axis), covering 4 of 8 cells; the remaining
    // 4 (a contiguous 2×2 block, cols 3-4 / rows 1-2) render as ONE fillComponent tile, not four.
    expect(html).toContain('a<');
    expect(html).toContain('grid-column:1 / span 2;grid-row:1 / span 2');
    expect(html).toContain('grid-column:3 / span 2;grid-row:1 / span 2');
    expect((html.match(/VOID/g) ?? []).length).toBe(1);
  });

  test("fillComponent as a function receives each gap's own placement", () => {
    const html = renderToStaticMarkup(
      <Grid
        nrCols={4}
        nrRows={2}
        stretch={1}
        fillComponent={({ row, col, rowSpan, colSpan }) => <i>{`${row},${col},${rowSpan}x${colSpan}`}</i>}
      >
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    // Same gap as the previous test (one 2×2 block at row 0, col 2) — the function gets told exactly
    // that, instead of rendering the same static node into every gap.
    expect(html).toContain('0,2,2x2');
  });

  test('rows always draws row tracks — rowHeight="auto" splits, fixed rowHeight reserves', () => {
    const auto = renderToStaticMarkup(
      <Grid nrCols={4} nrRows={3}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    const fixed = renderToStaticMarkup(
      <Grid nrCols={4} nrRows={3} rowHeight={40}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    expect(auto).toContain('grid-template-rows:repeat(3, minmax(0, 1fr))');
    expect(auto).toContain('height:100%');
    expect(fixed).toContain('grid-template-rows:repeat(3, 40px)');
  });

  test('an explicit rows smaller than content is a floor, not a cap — overflow rows still stretch/fill', () => {
    // cols=2, rows=1 declared, but 3 weight-1 items need 2 rows (a,b on row0; c alone on row1).
    // Regression: rowCount used to be clamped to the declared `rows`, so occupancy tracking for
    // anything past it silently went blind — nothing past row 1 could ever stretch.
    const html = renderToStaticMarkup(
      <Grid nrCols={2} nrRows={1}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={1}>b</GridItem>
        <GridItem weight={1}>c</GridItem>
      </Grid>,
    );

    expect(html).toContain('grid-template-rows:repeat(2, minmax(0, 1fr))'); // grew past the declared 1
    // b (row0, col1) stretches down into row 2 — only reachable if rowCount wasn't clamped to 1.
    expect(html).toContain('grid-column:2 / span 1;grid-row:1 / span 2');
  });

  test('omitting rows auto-fills height: exactly the occupied rows stretch (1fr)', () => {
    // 14 one-cell items in 12 columns occupy 2 rows — both stretch to fill, no guessed count.
    const html = renderToStaticMarkup(
      <Grid nrCols={12} stretch={0}>
        {Array.from({ length: 14 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static fixture, order never changes
          <GridItem key={i} weight={1}>
            {`i${i}`}
          </GridItem>
        ))}
      </Grid>,
    );

    expect(html).toContain('grid-template-rows:repeat(2, minmax(0, 1fr))');
    expect(html).toContain('height:100%');
  });

  test('showGrid draws guide lines whose period accounts for gap, not a background wash', () => {
    const on = renderToStaticMarkup(
      <Grid nrCols={6} nrRows={4} gap={10} showGrid>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    const off = renderToStaticMarkup(
      <Grid nrCols={6} nrRows={4} gap={10}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    // Column period: track (100% minus 5 gaps over 6 cols), then a 1px line centered in the gap —
    // never a flat `100% / 6`, and never the full gap width.
    const track = 'calc((100% - 5 * 10px) / 6)';
    const lineStart = `calc(${track} + (10px - 1px) / 2)`;
    const lineEnd = `calc(${lineStart} + 1px)`;
    expect(on).toContain(
      `repeating-linear-gradient(to right, transparent 0, transparent ${lineStart}, ` +
        `rgba(128,128,128,.5) ${lineStart}, rgba(128,128,128,.5) ${lineEnd}, transparent ${lineEnd}, transparent calc(${track} + 10px))`,
    );
    expect(on).toContain('repeating-linear-gradient(to bottom,');
    // Not a flat fill — must not appear anywhere in the item's own cell interior.
    expect(on).not.toContain('background:rgba');
    expect(off).not.toContain('background-image');
  });

  test('showGrid with a single column/row draws no line on that axis (nothing to divide)', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={1} nrRows={1} showGrid>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    expect(html).not.toContain('background-image');
  });

  // Regression: an explicitly-passed `undefined` prop must fall back to its default, not clobber it.
  test('an explicitly-undefined prop falls back to its default instead of breaking the CSS', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={5} gap={undefined} rowHeight={undefined}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).toContain('gap:8px');
  });

  test('animateSize/animatePosition render cleanly under SSR — no useLayoutEffect warning', () => {
    // useLayoutEffect is a no-op during SSR; the isomorphic fallback in src/react.tsx must keep
    // React from printing its "does nothing on the server" warning regardless of these props.
    const errors: unknown[] = [];
    const spy = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      renderToStaticMarkup(
        <Grid nrCols={4} animateSize animatePosition>
          <GridItem weight={1}>a</GridItem>
          <GridItem weight={2}>b</GridItem>
        </Grid>,
      );
    } finally {
      console.error = spy;
    }
    expect(errors).toEqual([]);
  });

  test('gridcell wrappers never carry a stray inline transform on first render', () => {
    const html = renderToStaticMarkup(
      <Grid nrCols={4} animateSize animatePosition>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    expect(html).not.toContain('transform');
  });

  describe('invariants hold across a matrix of grid setups', () => {
    // Placement must stay gap-free-aware (nothing overlaps), and every item keeps its source-order
    // index regardless of how cols/stretch/mix are combined. Covers weight-only, mixed strict/elastic,
    // and fully-strict item sets, each at a few column counts and stretch caps.
    const weightOnly = Array.from({ length: 9 }, (_, i) => ({ weight: (i % 4) + 1 }));
    const mixed = [{ weight: 2 }, { cols: 2 }, { rows: 2 }, { weight: 1 }, { cols: 2, rows: 2 }, { weight: 3 }];
    const fullyStrict = Array.from({ length: 5 }, (_, i) => ({ cols: (i % 3) + 1, rows: (i % 2) + 1 }));

    const setups: { name: string; items: { weight?: number; cols?: number; rows?: number }[] }[] = [
      { name: 'weight-only', items: weightOnly },
      { name: 'mixed strict/elastic', items: mixed },
      { name: 'fully strict', items: fullyStrict },
    ];

    for (const { name, items } of setups) {
      for (const nrCols of [3, 5, 8]) {
        for (const stretch of [0, 2, Number.POSITIVE_INFINITY]) {
          test(`${name}, nrCols=${nrCols}, stretch=${stretch}`, () => {
            const html = renderToStaticMarkup(
              <Grid nrCols={nrCols} stretch={stretch}>
                {items.map((props, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static fixture, order never changes
                  <GridItem key={i} {...props}>
                    {`item-${i}`}
                  </GridItem>
                ))}
              </Grid>,
            );

            // Every item rendered exactly once, in source order.
            const order = [...html.matchAll(/item-(\d+)/g)].map((m) => Number(m[1]));
            expect(order).toEqual(items.map((_, i) => i));

            // No cell double-covered: parse each item's placement and check for overlaps.
            const cells = [...html.matchAll(/grid-column:(\d+) \/ span (\d+);grid-row:(\d+) \/ span (\d+)/g)].map(
              ([, c, cs, r, rs]) => ({ c: Number(c), cs: Number(cs), r: Number(r), rs: Number(rs) }),
            );
            expect(cells.length).toBe(items.length);
            const occupied = new Set<string>();
            for (const { c, cs, r, rs } of cells) {
              for (let cc = c; cc < c + cs; cc++) {
                for (let rr = r; rr < r + rs; rr++) {
                  const key = `${cc},${rr}`;
                  expect(occupied.has(key)).toBe(false);
                  occupied.add(key);
                }
              }
            }

            // Nothing ever exceeds the declared column count.
            for (const { c, cs } of cells) expect(c + cs - 1).toBeLessThanOrEqual(nrCols);
          });
        }
      }
    }
  });
});

describe('flipTransform (FLIP policy)', () => {
  const box = (left: number, top: number, width = 100, height = 100) => ({ left, top, width, height });

  test('an unchanged box animates nothing', () => {
    expect(flipTransform(box(0, 0), box(0, 0), true, true)).toBeNull();
  });

  test('playback is damped, not a full replay of the delta', () => {
    // moved 20px right / 10px down. A textbook FLIP would start the item the whole 20/10 back;
    // half of it keeps the direction legible at half the amplitude.
    expect(flipTransform(box(0, 0), box(20, 10), false, true)).toBe('translate(-10px, -5px) scale(1, 1)');
    // scale damps towards 1 (its identity), not towards 0: halving 0.5 gives 0.75, not 0.25
    expect(flipTransform(box(0, 0, 50, 50), box(0, 0, 100, 100), true, false)).toBe(
      'translate(0px, 0px) scale(0.75, 0.75)',
    );
  });

  test('each flag only drives its own axis of the transform', () => {
    // size-only ignores the move; position-only ignores the resize
    expect(flipTransform(box(0, 0, 50, 50), box(20, 0, 100, 100), true, false)).toBe(
      'translate(0px, 0px) scale(0.75, 0.75)',
    );
    expect(flipTransform(box(0, 0, 50, 50), box(20, 0, 100, 100), false, true)).toBe(
      'translate(-10px, 0px) scale(1, 1)',
    );
  });

  test('a jump too large to read as motion snaps instead of flying in', () => {
    // this is the `nrCols` slider case: every tile lands hundreds of px from where it was, and
    // replaying that as a transform starts it outside the grid
    expect(flipTransform(box(0, 0), box(400, 0), false, true)).toBeNull();
    expect(flipTransform(box(0, 0, 100, 100), box(0, 0, 10, 10), true, false)).toBeNull();
    // …but a jump just inside the threshold still animates
    expect(flipTransform(box(0, 0), box(140, 0), false, true)).not.toBeNull();
  });

  test('the snap thresholds judge the real layout change, not the damped playback', () => {
    // 4x growth is over FLIP_MAX_SCALE and snaps, even though damping would have rendered it as a
    // 2.5x transform — otherwise the cap would silently loosen whenever the damping is retuned
    expect(flipTransform(box(0, 0, 400, 400), box(0, 0, 100, 100), true, false)).toBeNull();
  });

  test('a zero-sized box is skipped rather than dividing by zero', () => {
    expect(flipTransform(box(0, 0), box(0, 0, 0, 0), true, true)).toBeNull();
  });
});
