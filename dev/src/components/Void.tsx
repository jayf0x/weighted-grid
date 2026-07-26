import type { GridItemProps } from "weighted-grid/react";
import { formatCaps, formatSpanProps } from "@/lib/debugLabel";

/** Intentional-negative-space tile body. Render inside a `<GridItem>` — see `Item.tsx` for why this
 * can't wrap `GridItem` itself. Shows its index, span props, and effective stretch cap, same as
 * `Item`, so a void's shape (and how far it could still grow) is as easy to point at as a card's. */
export const Void = ({
  index,
  caps,
  ...spanProps
}: Omit<GridItemProps, "children"> & { index: number; caps: { col: number; row: number } }) => (
  <div className="bg-void w-full h-full text-[0.6rem]" id="void">
    <span id="index">{index}) </span>
    <span id="args">{formatSpanProps(spanProps)}</span>
    <span id="caps"> · {formatCaps(caps)}</span>
  </div>
);
