import type { GridItemProps } from "weighted-grid/react";

/** Real-content tile body: shows its index and the `GridItem` args that produced its span, so a
 * screenshot alone tells you why a tile is the size it is. Render inside a `<GridItem>` — `<Grid>`
 * only recognizes `GridItem` as a *direct* child, so this can never be the child of `<Grid>` itself. */
export const Item = ({
  index,
  ...spanProps
}: Omit<GridItemProps, "children"> & { index: number }) => (
  <div
    className="bg-item w-full h-full text-[0.6rem]"
    id="item"
    // style={{
    //   background: "url(/preview.png) cover",
    // }}
  >
    <span id="index">{index}) </span>
    <span id="args">
      {Object.entries(spanProps)
        .map(([k, v]) => `${k.slice(0, 1)}: ${v}`)
        .join(", ")}
    </span>
  </div>
);
