import { Grid, GridItem } from 'weighted-grid/react';
// Dev-only: reaches past the public `weighted-grid`/`weighted-grid/react` entries to compute the
// *effective* per-item stretch caps for the `dev` info-mode labels below — not part of the
// published API. Same pattern dev/src/components/CaseSection.tsx used.
import { stretchCapsOf } from '../../../src/utils';
import type { Example, InfoMode } from '@/typing';
import { Filler } from '@/components/Filler';
import { Item } from '@/components/Item';
import { Title } from '@/components/Title';
import { Void } from '@/components/Void';

/** Renders one `Example` (data-only: title + Grid props + tile list) as a live grid. Every static
 * example goes through this — identical wrapper, identical Item/Void/Filler visuals — so examples
 * only ever differ in the data they pass in.
 *
 * `<Grid>` only recognizes `GridItem` as a *direct* child, so `GridItem` has to sit right here —
 * `Item`/`Void` are its content, never its wrapper. */
export const ExampleSection = ({
  example: { title, meta, tiles },
  infoMode,
}: {
  example: Example;
  infoMode: InfoMode;
}) => (
  <section className="flex flex-col gap-3">
    <Title title={title} meta={meta} tileCount={tiles.length} />
    <div className="h-[420px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
      <Grid {...meta} fillComponent={(rect) => <Filler {...rect} />} className="h-full w-full">
        {tiles.map(({ kind, ...spanProps }, i) => {
          // The *effective* growth cap per axis — resolves the cols/rows-pinned-vs-elastic default
          // and any stretchX/stretchY/stretch override the same way `<Grid>` itself does, so the
          // dev-mode label always matches what actually got applied. Cheap; only the rendering
          // branches on infoMode.
          const caps = stretchCapsOf(spanProps, meta.stretch ?? Number.POSITIVE_INFINITY);
          return (
            <GridItem key={i} {...spanProps}>
              {kind === 'void' ? (
                <Void index={i} caps={caps} infoMode={infoMode} {...spanProps} />
              ) : (
                <Item index={i} caps={caps} infoMode={infoMode} {...spanProps} />
              )}
            </GridItem>
          );
        })}
      </Grid>
    </div>
  </section>
);
