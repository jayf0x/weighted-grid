/**
 * `weighted-grid` — a weighted CSS-Grid: items sized by `weight` (or exact `cols`/`rows` spans),
 * laid out in strict source order. Empty cells are resolved in one pass: weight-only items
 * `stretch` to absorb gaps first (fair, equally split between neighbors on each side — never all
 * growth to one item), then whatever `stretch` couldn't reach is plugged with `fillComponent`, if
 * one was passed. `react` is a peer dependency, not bundled.
 */
import { memo, type CSSProperties, type PropsWithChildren, type ReactNode } from "react";
import { toCss, spanFor, packedRowCount, placeSpans, fillDeadZones, isElasticItem, asGridItems } from "./utils";

export type GridItemProps = PropsWithChildren<{
  /** Relative size, flexbox-`flex`-style ("how much of the grid do I get"). Fills whichever axis you
   * don't pin with `cols`/`rows`; pin neither and it drives both (`weight={2}` → a 2×2 block, so
   * equal weights are equal squares). Defaults to 1. */
  weight?: number;
  /** Exact column span. Pins the horizontal axis (then `weight` only drives rows). Clamped to `cols`.
   * An item with an explicit `cols` **or** `rows` is *strict* — it never stretches to fill gaps. */
  cols?: number;
  /** Exact row span. Pins the vertical axis (then `weight` only drives columns). Strict, see `cols`. */
  rows?: number;
}>;

export type GridProps = PropsWithChildren<{
  /** Number of columns. Always scales with the container width. Defaults to 7. */
  cols?: number;
  /** Number of row tracks. Omit it (default) and the grid auto-counts the rows its items occupy, then
   * stretches exactly that many to fill the height. Set it to force a fixed track count. */
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

const gridLinesStyle = (cols: number, rows: number): CSSProperties => ({
  backgroundImage:
    "linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)," +
    "linear-gradient(rgba(255,255,255,.06) 1px, transparent 0)",
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
  // Auto-count the rows the flow occupies so `1fr` tracks stretch to fill the height; an explicit
  // `rows` forces a fixed count instead.
  const rowCount = rows ?? packedRowCount(gridSpan, cols, false);

  // Own placement (strict source order). Gaps are resolved in one pass: grow weight-only items into
  // dead cells first (fair, capped by `stretch`), then whatever's left gets `fillComponent`.
  const base = placeSpans(gridSpan, cols, false).placements;
  const placed = fillDeadZones(
    base,
    items.map((it) => isElasticItem(it.props)),
    cols,
    rowCount,
    stretch,
  );

  const emptyCells: Array<{ r: number; c: number }> = [];
  if (fillComponent != null) {
    const occ = Array.from({ length: rowCount }, () => new Array<boolean>(cols).fill(false));
    for (const p of placed)
      for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
        for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r]) occ[r][c] = true;
    for (let r = 0; r < rowCount; r++)
      for (let c = 0; c < cols; c++) if (!occ[r][c]) emptyCells.push({ r, c });
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
      {emptyCells.map(({ r, c }) => (
        <div
          key={`empty-${r}-${c}`}
          aria-hidden
          style={{ gridColumn: `${c + 1} / span 1`, gridRow: `${r + 1} / span 1` }}
        >
          {fillComponent}
        </div>
      ))}
    </div>
  );
});
