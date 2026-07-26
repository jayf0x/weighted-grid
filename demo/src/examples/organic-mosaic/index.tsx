import { Grid, GridItem } from 'weighted-grid/react';
import type { InfoMode } from '@/typing';
import { Filler } from '@/components/Filler';
import { Void } from '@/components/Void';
// Dev-only: see ExampleSection.tsx for why this reaches past the public entry points.
import { stretchCapsOf } from '../../../../src/utils';
import { generateOrganicTiles } from './generator';
import { imageFor } from './images';

const SEED = 42;
const NR_COLS = 48;

const META = { nrCols: NR_COLS, rowHeight: 12, gap: 4, stretch: 8 } as const;
const TILES = generateOrganicTiles(SEED, 40, NR_COLS);

/** Real-looking repo-card tile: a background image (from `demo/public/organic/`, cycled
 * deterministically by index — see `images.ts`) plus a title bar, object-cover, same treatment as
 * jayf0x.github.io's Showcase `CardMedia`, simplified for a demo (no gif/language-icon fallback). */
const Card = ({ index }: { index: number }) => (
  <div className="group relative h-full w-full overflow-hidden rounded-md border border-black/[0.04] bg-panel">
    <img
      src={imageFor(index)}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1.5">
      <span className="font-mono text-[10px] text-white/90">card {index}</span>
    </div>
  </div>
);

/** "Exotic Example" — real (well, real-looking) content, no controls, no QA labeling (seed/tile
 * count are implementation detail nobody browsing the demo cares about). Ported from dev's
 * `2-organic.ts` + `organic.ts` generator. Static — generated once at module scope, not per
 * render. Sized big — this is the "full fashion" showcase, last in the stacked shell. */
export function OrganicMosaicExample({ infoMode }: { infoMode: InfoMode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">Exotic Example</h2>
      <div className="h-[900px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
        <Grid {...META} fillComponent={(rect) => <Filler {...rect} />} className="h-full w-full">
          {TILES.map(({ kind, ...spanProps }, i) => (
            <GridItem key={i} {...spanProps}>
              {kind === 'void' ? (
                <Void
                  index={i}
                  caps={stretchCapsOf(spanProps, META.stretch)}
                  infoMode={infoMode}
                  {...spanProps}
                />
              ) : (
                <Card index={i} />
              )}
            </GridItem>
          ))}
        </Grid>
      </div>
    </section>
  );
}
