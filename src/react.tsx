/**
 * `weighted-grid` — a weighted CSS-Grid: items sized by `weight` (or exact `cols`/`rows` spans),
 * laid out in strict source order. Empty cells are resolved in one pass: weight-driven axes
 * `stretch` to absorb gaps first (fair, equally split between neighbors on each side — never all
 * growth to one item; pinning `cols` or `rows` only freezes that axis, the other keeps stretching),
 * then whatever's left gets merged into unified rectangular blocks and plugged with `fillComponent`,
 * if one was passed. `react` is a peer dependency, not bundled.
 */
import { memo, type CSSProperties, type PropsWithChildren, type ReactNode } from "react";
import { toCss, spanFor, packedRowCount, placeSpans, fillDeadZones, elasticityOf, groupEmptyRects, asGridItems } from "./utils";

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
}>;

export type GridProps = PropsWithChildren<{
  /** Number of columns. Always scales with the container width. Defaults to 7. */
  cols?: number;
  /** Minimum number of row tracks. Omit it (default) and the grid auto-counts the rows its items
   * occupy, then stretches exactly that many to fill the height. Set it to reserve extra headroom
   * for `stretch` to grow into — it's a floor, not a cap: content that needs more rows always gets
   * them regardless of this value (same as CSS Grid's own implicit-row overflow). */
  rows?: number;
  gap?: number | string;
  /** `"auto"` (default): stretch to the parent's height, splitting it into `rows` bands — the parent
   * must have a height. A number/string (e.g. `100`, `"5rem"`): fixed height per row, grid grows down. */
  rowHeight?: "auto" | number | string;
  /** Extra cells a weight-only item may grow **per axis** to absorb gaps (`0` off, `Infinity` default
   * = fill as far as possible). Growth is fair — split evenly between the items flanking a gap, never
   * all to one. Runs first, regardless of `fillComponent`. */
  stretch?: number;
  /** Rendered in whatever's left over after `stretch` — the cells no elastic neighbor could reach.
   * Doesn't disable stretching; it plugs the remainder. Default: undefined (those cells stay empty). */
  fillComponent?: ReactNode;
  /** Debug overlay: faint column + row guide lines. */
  showGrid?: boolean;
  className?: string;
  style?: CSSProperties;
}>;

/** Marker component — `Grid` reads its props and renders its children in the assigned block. */
export const GridItem = (_: GridItemProps): null => null;

// A mid-gray, not near-white — the previous rgba(255,255,255,.06) was only ever visible on a dark
// page; a neutral gray at 40% shows up on both light and dark backgrounds.
const gridLinesStyle = (cols: number, rows: number): CSSProperties => ({
  backgroundImage:
    "linear-gradient(90deg, rgba(128,128,128,.4) 1px, transparent 0)," +
    "linear-gradient(rgba(128,128,128,.4) 1px, transparent 0)",
  backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`,
});

export const Grid = memo((props: GridProps) => {
  const {
    children,
    cols = 7,
    rows,
    gap = 8,
    rowHeight = "auto",
    stretch = Number.POSITIVE_INFINITY,
    fillComponent,
    showGrid = false,
    className = "",
    style,
  } = props;

  const items = asGridItems(children);
  const gridSpan = items.map((item) => spanFor(item.props, cols));
  const track = rowHeight === "auto" ? "minmax(0, 1fr)" : toCss(rowHeight);
  // `rows` is a floor, not a hard cap: `placeSpans` below never wraps on row count (only `cols`
  // wraps), so content that needs more rows than `rows` declares still gets placed past it. If
  // `rowCount` didn't grow to match, every occupancy/stretch/fill computation downstream would size
  // its tracking arrays too small and silently go blind past that row — items past it would never
  // stretch, and holes past it would never get `fillComponent`. Auto (`rows` omitted) already sizes
  // exactly to content; an explicit `rows` only ever adds headroom above that for stretch to use.
  const rowCount = Math.max(rows ?? 0, packedRowCount(gridSpan, cols, false));

  // Own placement (strict source order). Gaps are resolved in one pass: grow weight-only items into
  // dead cells first (fair, capped by `stretch`), then whatever's left gets `fillComponent`.
  const base = placeSpans(gridSpan, cols, false).placements;
  const placed = fillDeadZones(
    base,
    items.map((it) => elasticityOf(it.props)),
    cols,
    rowCount,
    stretch,
  );

  // Whatever's still empty after stretch, merged into unified rectangular blocks (one fillComponent
  // tile per gap, not one per cell — the filler has no per-cell identity to preserve).
  let fillerRects: ReturnType<typeof groupEmptyRects> = [];
  if (fillComponent != null) {
    const occ = Array.from({ length: rowCount }, () => new Array<boolean>(cols).fill(false));
    for (const p of placed)
      for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
        for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r]) occ[r][c] = true;
    fillerRects = groupEmptyRects(occ, cols, rowCount);
  }

  const containerStyles: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowCount}, ${track})`,
    gridAutoRows: track,
    gap: toCss(gap),
    ...(rowHeight === "auto" ? { height: "100%" } : {}),
    ...(showGrid ? gridLinesStyle(cols, rowCount) : {}),
    ...style,
  };

  return (
    <div className={className} style={containerStyles} role="grid">
      {items.map((item, i) => {
        const p = placed[i];
        return (
          <div
            key={item.key ?? i}
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
          {fillComponent}
        </div>
      ))}
    </div>
  );
});
