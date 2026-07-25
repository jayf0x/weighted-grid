import { Grid, GridItem } from "weighted-grid/react";
import type { Case } from "@/lib/case";
import { Filler } from "@/components/Filler";
import { Item } from "@/components/Item";
import { Title } from "@/components/Title";
import { Void } from "@/components/Void";

/** Renders one `Case` (data-only: title + Grid props + tile list) as a live grid. Every case in
 * `dev/src/cases` goes through this — identical wrapper, identical Item/Void/Filler visuals — so
 * cases only ever differ in the data they pass in.
 *
 * `<Grid>` only recognizes `GridItem` as a *direct* child (see `src/utils.ts`'s `asGridItems`), so
 * `GridItem` has to sit right here — `Item`/`Void` are its content, never its wrapper. */
export const CaseSection = ({ title, meta, tiles }: Case) => (
  <section className="mx-auto w-[900px] m-5">
    <Title title={title} meta={meta} tileCount={tiles.length} />
    <Grid {...meta} fillComponent={<Filler />}>
      {tiles.map(({ kind, ...spanProps }, i) => (
        <GridItem key={i} {...spanProps}>
          {kind === "void" ? <Void /> : <Item index={i} {...spanProps} />}
        </GridItem>
      ))}
    </Grid>
  </section>
);
