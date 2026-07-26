import type { GridItemProps } from "weighted-grid/react";
import { formatCaps, formatSpanProps } from "@/lib/debugLabel";

/** Real-content tile body: shows its index, the `GridItem` args that produced its span, and the
 * *effective* stretch cap `<Grid>` actually applied (`caps`, from `stretchCapsOf` — resolves the
 * cols/rows pin and any stretch/stretchX/stretchY override the same way the grid does), so a
 * screenshot alone tells you why a tile is the size it is, and how much further it could still grow.
 * Render inside a `<GridItem>` — `<Grid>` only recognizes `GridItem` as a *direct* child, so this
 * can never be the child of `<Grid>` itself. */
export const Item = ({
  index,
  caps,
  ...spanProps
}: Omit<GridItemProps, "children"> & { index: number; caps: { col: number; row: number } }) => (
  <div className="bg-item w-full h-full text-[0.6rem]" id="item">
    <span id="index">{index}) </span>
    <span id="args">{formatSpanProps(spanProps)}</span>
    <span id="caps"> · {formatCaps(caps)}</span>
  </div>
);
