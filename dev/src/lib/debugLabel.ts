import type { GridItemProps } from "weighted-grid/react";

/** Short, collision-free abbreviations for `Item`/`Void` debug labels — `stretch`/`stretchX`/
 * `stretchY` all share a first letter, so a naive `k.slice(0,1)` can't tell them apart. */
const ABBR: Record<string, string> = {
  cols: "c",
  rows: "r",
  weight: "w",
  stretch: "st",
  stretchX: "sx",
  stretchY: "sy",
};

export const formatSpanProps = (spanProps: Omit<GridItemProps, "children">) =>
  Object.entries(spanProps)
    .map(([k, v]) => `${ABBR[k] ?? k}: ${v}`)
    .join(", ");

/** The effective per-axis growth cap `<Grid>` actually applied (see `stretchCapsOf`) — what the
 * raw `stretch`/`stretchX`/`stretchY` props resolve to once the grid's own `stretch` default and
 * the cols/rows pin are factored in. */
export const formatCaps = (caps: { col: number; row: number }) =>
  `cap: ${caps.col === Number.POSITIVE_INFINITY ? "∞" : caps.col}x${caps.row === Number.POSITIVE_INFINITY ? "∞" : caps.row}`;
