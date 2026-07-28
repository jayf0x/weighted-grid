import type React from "react";
import type { GridItemProps, GridProps } from "../../src/react";

/** One tile in an example: `kind` picks the visual (real content vs. intentional negative space),
 * the rest is passed straight through to `<GridItem>`. */
export type ExampleTile = { kind?: "item" | "void" } & GridItemProps;

/** The subset of `GridProps` an example cares about (no `children`/`className`/`style` — those are
 * fixed by `ExampleSection`). Kept as plain data so both the app shell and
 * `scripts/dev/dev-report-grid.ts` can read an example's setup without touching JSX. */
export type ExampleMeta = Partial<
  Pick<
    GridProps,
    "nrCols" | "nrRows" | "rowHeight" | "gap" | "stretch" | "showGrid"
  >
>;

export type Example = {
  title: string;
  meta: ExampleMeta;
  tiles: ExampleTile[];
};

/** One entry in `src/examples/index.ts`'s ordered list. Static examples (prop-matrix, pinned-spans,
 * organic-mosaic) are plain `Example` data; `row-height` is the one example allowed to be a
 * stateful React component instead (see the merge plan's "interactivity gap" — one interactive
 * example doesn't earn a generic `controls` descriptor on the shared `Example` type). */
export type InfoMode = "simple" | "dev";

export type ExampleEntry =
  | { kind: "data"; example: Example }
  | {
      kind: "component";
      title: string;
      Component: React.ComponentType<{ infoMode: InfoMode }>;
    };
