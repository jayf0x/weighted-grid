/**
 * `weighted-grid` — a weighted CSS-Grid: items sized by `weight` (or exact `cols`/`rows` spans),
 * laid out in strict source order. Empty cells are resolved in one pass: weight-driven axes
 * `stretch` to absorb gaps first (fair, equally split between neighbors on each side — never all
 * growth to one item; pinning `cols` or `rows` only freezes that axis, the other keeps stretching),
 * then whatever's left gets merged into unified rectangular blocks and plugged with `fillComponent`,
 * if one was passed. `react` is a peer dependency, not bundled.
 */
import {
  type CSSProperties,
  memo,
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import type { PresetFn } from './presets';
import {
  asGridItems,
  fillDeadZones,
  groupEmptyRects,
  packedRowCount,
  placeSpans,
  spanFor,
  stretchCapsOf,
  toCss,
} from './utils';

// `useLayoutEffect` warns when it runs during SSR (`renderToStaticMarkup` etc.); it does nothing
// there anyway, so fall back to the no-op-safe `useEffect` outside the browser.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type GridItemProps = PropsWithChildren<{
  /** Relative size, flexbox-`flex`-style ("how much of the grid do I get"). Fills whichever axis you
   * don't pin with `cols`/`rows`; pin neither and it drives both (`weight={2}` → a 2×2 block, so
   * equal weights are equal squares). Defaults to 1. */
  weight?: number;
  /** Exact column span. Pins the horizontal axis — it never stretches — while `weight` keeps driving
   * rows (still elastic, unless `rows` is also pinned). Clamped to the grid's column count. */
  cols?: number;
  /** Exact row span. Pins the vertical axis — it never stretches — while `weight` keeps driving
   * columns (still elastic, unless `cols` is also pinned). */
  rows?: number;
  /** Extra cells this item may still grow, per axis, beyond `cols`/`rows`/`weight` — even on an axis
   * `cols`/`rows` pinned (normally frozen at 0 growth). Sets both axes; `stretchX`/`stretchY`
   * override per axis. Also works the other way: caps a `weight`-driven (normally fully elastic) axis
   * below the `Grid`-level `stretch` default. Doesn't affect `weight`/`cols`/`rows` themselves, only
   * how far `stretch` may grow the item afterward. */
  stretch?: number;
  /** Per-axis override of `stretch` for the column axis. */
  stretchX?: number;
  /** Per-axis override of `stretch` for the row axis. */
  stretchY?: number;
}>;

export type GridProps = PropsWithChildren<{
  /** Number of columns. Always scales with the container width. Defaults to 7. Named `nrCols`, not
   * `cols`, so it reads unambiguously as a count — `<GridItem cols>` means something different (a
   * span), and the two showing up in the same JSX block was the confusing part. */
  nrCols?: number;
  /** Minimum number of row tracks. Omit it (default, and the right choice for most grids) and the
   * grid auto-counts the rows its items occupy, then stretches exactly that many to fill the height.
   * Set it only to reserve extra headroom for `stretch` to grow into — it's a floor, not a cap:
   * content that needs more rows always gets them regardless of this value (same as CSS Grid's own
   * implicit-row overflow), so setting it *below* what content needs has no visible effect. */
  nrRows?: number;
  /** Auto-assigns `weight`/`cols`/`rows` per item so the grid fills itself with minimal config — a
   * {@link PresetFn}, e.g. `masonPreset(4)` from `weighted-grid/presets`, or your own
   * `({ count, nrCols }) => [...]`. Explicit props on a `GridItem` always override the preset's
   * defaults. Pass a stable function (e.g. wrap a custom preset in `useCallback`) so it doesn't
   * recompute every render. */
  preset?: PresetFn;
  gap?: number | string;
  /** `"auto"` (default): stretch to the parent's height, splitting it into row bands — the parent
   * must have a height. A number/string (e.g. `100`, `"5rem"`): fixed height per row, grid grows down. */
  rowHeight?: 'auto' | number | string;
  /** Extra cells a weight-only item may grow **per axis** to absorb gaps (`0` off, `Infinity` default
   * = fill as far as possible). Growth is fair — split evenly between the items flanking a gap, never
   * all to one. Runs first, regardless of `fillComponent`. */
  stretch?: number;
  /** Rendered in whatever's left over after `stretch` — the cells no elastic neighbor could reach.
   * Doesn't disable stretching; it plugs the remainder. A plain `ReactNode` renders the same node in
   * every gap; pass a function to receive each gap's own placement (post-merge, see
   * {@link groupEmptyRects}) — e.g. for a debug label or a size-aware filler. Default: undefined
   * (those cells stay empty). */
  fillComponent?: ReactNode | ((rect: { row: number; col: number; rowSpan: number; colSpan: number }) => ReactNode);
  /** Debug overlay: draws a guide line exactly on the real `gap` gutter between items (a gradient
   * whose period accounts for `gap`, not a simulated line that can drift out of sync with it). */
  showGrid?: boolean;
  /** Smoothly transition an item's on-screen size when its span changes (e.g. `stretch` growing it
   * into a gap after a re-layout). CSS Grid line/span values aren't natively interpolable, so this
   * is a FLIP transform (`scale`, transitioned back to identity) applied after layout, not a real
   * grid-track animation. Default: `false`. */
  animateSize?: boolean;
  /** Same FLIP mechanism as `animateSize`, but for on-screen position (`translate`) instead of size.
   * Off by default — most layout changes reorder enough that animating position reads as noisy; turn
   * it on only for grids where items mostly nudge rather than jump. Default: `false`. */
  animatePosition?: boolean;
  className?: string;
  style?: CSSProperties;
}>;

/** Marker component — `Grid` reads its props and renders its children in the assigned block. */
export const GridItem = (_: GridItemProps): null => null;

// `showGrid`'s guide lines are drawn exactly where the real `gap` gutter is — a repeating gradient
// whose period is `track + gap` (both track and gap expressed in the same `calc()`, so it works for
// any gap unit, not just px). The line itself is a fixed 1px, centered in the gap — the rest of the
// gap stays empty space either side of it. Unlike painting the container itself, this only ever
// marks that 1px band; it can't bleed grey into a semi-transparent item's own interior, and unlike a
// naive `100% / n` division, the math includes `gap` so the line never drifts off the real gutter.
const gridLinesColor = 'rgba(128,128,128,.5)';

const gridLinesStyle = (nrCols: number, rowCount: number, gapCss: string): CSSProperties => {
  const band = (count: number, direction: 'to right' | 'to bottom') => {
    if (count <= 1) return null;
    const track = `calc((100% - ${count - 1} * ${gapCss}) / ${count})`;
    const lineStart = `calc(${track} + (${gapCss} - 1px) / 2)`;
    const lineEnd = `calc(${lineStart} + 1px)`;
    const period = `calc(${track} + ${gapCss})`;
    return (
      `repeating-linear-gradient(${direction}, transparent 0, transparent ${lineStart}, ` +
      `${gridLinesColor} ${lineStart}, ${gridLinesColor} ${lineEnd}, transparent ${lineEnd}, transparent ${period})`
    );
  };
  const layers = [band(nrCols, 'to right'), band(rowCount, 'to bottom')].filter(Boolean);
  return layers.length ? { backgroundImage: layers.join(',') } : {};
};

const FLIP_MS = 200;

/**
 * FLIP transition for `animateSize`/`animatePosition`: CSS Grid line/span values aren't natively
 * interpolable, so instead of animating layout, this measures each item's box before/after a render
 * and plays the delta back as a `transform` (scale for size, translate for position) that eases to
 * identity. Returns a per-item ref-callback factory; call it once per rendered item with a stable key.
 */
const useFlip = (animateSize: boolean, animatePosition: boolean) => {
  const nodesRef = useRef<Map<string, HTMLDivElement> | undefined>(undefined);
  const rectsRef = useRef<Map<string, DOMRect> | undefined>(undefined);
  // Ref callbacks are cached per key and reused across renders — a fresh closure every render would
  // give React a new ref identity each time, forcing a detach/reattach cycle for every item on every
  // render for no reason.
  const refFnsRef = useRef<Map<string, (el: HTMLDivElement | null) => void> | undefined>(undefined);
  nodesRef.current ??= new Map();
  rectsRef.current ??= new Map();
  refFnsRef.current ??= new Map();
  const animate = animateSize || animatePosition;

  useIsomorphicLayoutEffect(() => {
    const rects = rectsRef.current!;
    if (!animate) {
      rects.clear();
      return;
    }
    for (const [key, el] of nodesRef.current!) {
      const next = el.getBoundingClientRect();
      const prev = rects.get(key);
      if (prev && next.width && next.height) {
        const dx = animatePosition ? prev.left - next.left : 0;
        const dy = animatePosition ? prev.top - next.top : 0;
        const sx = animateSize ? prev.width / next.width : 1;
        const sy = animateSize ? prev.height / next.height : 1;
        if (dx || dy || sx !== 1 || sy !== 1) {
          el.style.transition = 'none';
          el.style.transformOrigin = 'top left';
          el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
          el.getBoundingClientRect(); // flush, so the reset below actually transitions
          el.style.transition = `transform ${FLIP_MS}ms ease`;
          el.style.transform = '';
        }
      }
      rects.set(key, next);
    }
  });

  return (key: string) => {
    let fn = refFnsRef.current!.get(key);
    if (!fn) {
      fn = (el) => {
        if (el) nodesRef.current!.set(key, el);
        else {
          nodesRef.current!.delete(key);
          rectsRef.current!.delete(key);
          refFnsRef.current!.delete(key);
        }
      };
      refFnsRef.current!.set(key, fn);
    }
    return fn;
  };
};

export const Grid = memo((props: GridProps) => {
  const {
    children,
    nrCols = 7,
    nrRows,
    preset,
    gap = 8,
    rowHeight = 'auto',
    stretch = Number.POSITIVE_INFINITY,
    fillComponent,
    showGrid = false,
    animateSize = false,
    animatePosition = false,
    className = '',
    style,
  } = props;

  const items = asGridItems(children);
  const presetProps = useMemo(
    () => preset?.({ count: items.length, nrCols, nrRows }),
    [preset, items.length, nrCols, nrRows],
  );
  // Preset defaults, overridden by whatever the caller actually set on the `GridItem` — a plain
  // object spread per item, not a clone; nothing downstream needs the element itself, only its
  // props (`spanFor`/`stretchCapsOf` read a props object, rendering reads `item.props.children`
  // directly, untouched by any of this).
  const itemProps = presetProps
    ? items.map((item, i) => ({ ...presetProps[i], ...item.props }))
    : items.map((item) => item.props);
  const gridSpan = itemProps.map((props) => spanFor(props, nrCols));
  const track = rowHeight === 'auto' ? 'minmax(0, 1fr)' : toCss(rowHeight);
  // `nrRows` is a floor, not a hard cap: `placeSpans` below never wraps on row count (only `nrCols`
  // wraps), so content that needs more rows than `nrRows` declares still gets placed past it. If
  // `rowCount` didn't grow to match, every occupancy/stretch/fill computation downstream would size
  // its tracking arrays too small and silently go blind past that row — items past it would never
  // stretch, and holes past it would never get `fillComponent`. Auto (`nrRows` omitted) already sizes
  // exactly to content; an explicit `nrRows` only ever adds headroom above that for stretch to use.
  const rowCount = Math.max(nrRows ?? 0, packedRowCount(gridSpan, nrCols, false));

  // Own placement (strict source order). Gaps are resolved in one pass: grow weight-only items into
  // dead cells first (fair, capped by `stretch`), then whatever's left gets `fillComponent`.
  const base = placeSpans(gridSpan, nrCols, false).placements;
  const placed = fillDeadZones(
    base,
    itemProps.map((props) => stretchCapsOf(props, stretch)),
    nrCols,
    rowCount,
  );

  // Whatever's still empty after stretch, merged into unified rectangular blocks (one fillComponent
  // tile per gap, not one per cell — the filler has no per-cell identity to preserve).
  let fillerRects: ReturnType<typeof groupEmptyRects> = [];
  if (fillComponent != null) {
    const occ = Array.from({ length: rowCount }, () => new Array<boolean>(nrCols).fill(false));
    for (const p of placed)
      for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
        for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r]) occ[r][c] = true;
    fillerRects = groupEmptyRects(occ, nrCols, rowCount);
  }

  const gapCss = toCss(gap);
  const containerStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${nrCols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowCount}, ${track})`,
    gridAutoRows: track,
    gap: gapCss,
    ...(rowHeight === 'auto' ? { height: '100%' } : {}),
    ...(showGrid ? gridLinesStyle(nrCols, rowCount, gapCss) : {}),
    ...style,
  };

  const flipRef = useFlip(animateSize, animatePosition);

  return (
    // biome-ignore lint/a11y/useSemanticElements: arbitrary weighted layout, not tabular data — a real <table> would force row/column semantics the content doesn't have.
    <div className={className} style={containerStyles} role="grid">
      {items.map((item, i) => {
        const p = placed[i];
        const key = String(item.key ?? i);
        return (
          // biome-ignore lint/a11y/useSemanticElements: see role="grid" above.
          <div
            key={key}
            ref={flipRef(key)}
            role="gridcell"
            tabIndex={0}
            style={{
              minWidth: 0,
              minHeight: 0,
              // 0-indexed model → 1-indexed CSS lines.
              gridColumn: `${p.colStart + 1} / span ${p.colSpan}`,
              gridRow: `${p.rowStart + 1} / span ${p.rowSpan}`,
            }}
          >
            {item.props.children}
          </div>
        );
      })}
      {fillerRects.map((p) => (
        <div
          key={`empty-${p.rowStart}-${p.colStart}`}
          aria-hidden
          style={{
            gridColumn: `${p.colStart + 1} / span ${p.colSpan}`,
            gridRow: `${p.rowStart + 1} / span ${p.rowSpan}`,
          }}
        >
          {typeof fillComponent === 'function'
            ? fillComponent({ row: p.rowStart, col: p.colStart, rowSpan: p.rowSpan, colSpan: p.colSpan })
            : fillComponent}
        </div>
      ))}
    </div>
  );
});
