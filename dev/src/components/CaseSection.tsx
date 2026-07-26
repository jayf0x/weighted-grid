import { Grid, GridItem } from "weighted-grid/react";
import type { Case } from "@/lib/case";
import { Filler } from "@/components/Filler";
import { Item } from "@/components/Item";
import { Title } from "@/components/Title";
import { Void } from "@/components/Void";
// Dev-only: reaches past the public `weighted-grid`/`weighted-grid/react` entries to compute the
// *effective* per-item stretch caps for the debug labels below — not part of the published API.
import { stretchCapsOf } from "../../../src/utils";

/** Renders one `Case` (data-only: title + Grid props + tile list) as a live grid. Every case in
 * `dev/src/cases` goes through this — identical wrapper, identical Item/Void/Filler visuals — so
 * cases only ever differ in the data they pass in.
 *
 * `<Grid>` only recognizes `GridItem` as a *direct* child (see `src/utils.ts`'s `asGridItems`), so
 * `GridItem` has to sit right here — `Item`/`Void` are its content, never its wrapper. */
export const CaseSection = ({ title, meta, tiles }: Case) => (
  <section className="mx-auto w-[900px] m-5">
    <Title title={title} meta={meta} tileCount={tiles.length} />
    <Grid {...meta} fillComponent={(rect) => <Filler {...rect} />} showGrid>
      {tiles.map(({ kind, ...spanProps }, i) => {
        // The *effective* growth cap per axis — resolves the cols/rows-pinned-vs-elastic default and
        // any stretchX/stretchY/stretch override the same way `<Grid>` itself does, so the debug
        // label always matches what actually got applied, not just the raw prop that was passed.
        const caps = stretchCapsOf(spanProps, meta.stretch ?? Number.POSITIVE_INFINITY);
        return (
          <GridItem key={i} {...spanProps}>
            {kind === "void" ? (
              <Void index={i} caps={caps} {...spanProps} />
            ) : (
              <Item index={i} caps={caps} {...spanProps} />
            )}
          </GridItem>
        );
      })}
    </Grid>
  </section>
);
