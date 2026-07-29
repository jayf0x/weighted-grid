import { Grid, GridItem } from 'weighted-grid/react';
// Dev-only: reaches past the public `weighted-grid`/`weighted-grid/react` entries to compute the
// *effective* per-item stretch caps for the `dev` info-mode labels below — not part of the
// published API. Same pattern dev/src/components/CaseSection.tsx used.
import { stretchCapsOf } from '../../../src/core';
import type { Example, InfoMode, PlateInfo } from '@/typing';
import { CornerTicks } from '@/components/CornerTicks';
import { Filler } from '@/components/Filler';
import { Item } from '@/components/Item';
import { Title } from '@/components/Title';
import { Void } from '@/components/Void';
import { useSectionControls } from '@/utils/controlsRail';

/** Static examples are reference data, not toys — the rail shows what's in effect instead of
 * sliders that would fight the point of an exhaustive/fixed layout. */
const StaticInfoPanel = ({ title, meta, tileCount }: { title: string; meta: Example['meta']; tileCount: number }) => (
  <div className="flex flex-col gap-2 text-[13px]">
    <p className="text-ink/50">{title}</p>
    <p className="text-ink/35">{tileCount} tiles · static reference, no live controls</p>
    <dl className="flex flex-col gap-1 font-mono text-[11px] text-ink/45">
      {Object.entries(meta).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt>{k}</dt>
          <dd>{String(v)}</dd>
        </div>
      ))}
    </dl>
  </div>
);

/** Renders one `Example` (data-only: title + Grid props + tile list) as a live grid. Every static
 * example goes through this — identical wrapper, identical Item/Void/Filler visuals — so examples
 * only ever differ in the data they pass in.
 *
 * `<Grid>` only recognizes `GridItem` as a *direct* child, so `GridItem` has to sit right here —
 * `Item`/`Void` are its content, never its wrapper. */
export const ExampleSection = ({
  example: { title, meta, tiles },
  infoMode,
  plate,
}: {
  example: Example;
  infoMode: InfoMode;
  plate: PlateInfo;
}) => {
  const ref = useSectionControls<HTMLElement>(title, <StaticInfoPanel title={title} meta={meta} tileCount={tiles.length} />);

  return (
    <section ref={ref} className="flex flex-col gap-3">
      <Title title={title} meta={meta} tileCount={tiles.length} plate={plate} />
      <div className="relative">
        <CornerTicks />
        <div className="h-[420px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
          <Grid {...meta} fillComponent={(rect) => <Filler {...rect} />} className="h-full w-full">
            {tiles.map(({ kind, ...spanProps }, i) => {
              // The *effective* growth cap per axis — resolves the cols/rows-pinned-vs-elastic
              // default and any stretchX/stretchY/stretch override the same way `<Grid>` itself
              // does, so the dev-mode label always matches what actually got applied. Cheap; only
              // the rendering branches on infoMode.
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
      </div>
    </section>
  );
};
