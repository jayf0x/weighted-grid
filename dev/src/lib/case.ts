import type { GridItemProps, GridProps } from "../../../src/react";

/** One tile in a case: `kind` picks the visual (real content vs. intentional negative space), the
 * rest is passed straight through to `<GridItem>`. */
export type CaseTile = { kind: "item" | "void" } & GridItemProps;

/** The subset of `GridProps` a case cares about (no `children`/`className`/`style` — those are
 * fixed by `CaseGrid`). Kept as plain data so both the dev app and `scripts/dev-report-grid.ts` can
 * read a case's setup without touching JSX. */
export type CaseMeta = Partial<
  Pick<GridProps, "nrCols" | "nrRows" | "rowHeight" | "gap" | "stretch" | "showGrid">
>;

export type Case = {
  title: string;
  meta: CaseMeta;
  tiles: CaseTile[];
};
