import { Grid, GridItem } from 'weighted-grid/react';
import { presets } from 'weighted-grid';
import { Item } from '@/components/Item';
import type { InfoMode } from '@/typing';

const TILE_COUNT = 18;
const NR_COLS = 8;

/** One small labeled grid per `mode` preset — `Object.keys(presets)` drives the list, so a new
 * entry in `src/presets.ts` shows up here with no changes to this file. Deliberately tiny (fixed
 * height, few tiles): the point is "what does this mode do to plain, prop-less items", not a
 * full showcase. */
export const ModesExample = ({ infoMode }: { infoMode: InfoMode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">
      mode — auto-assigned weight/cols/rows per preset
    </h2>
    <div className="flex flex-wrap gap-4">
      {Object.keys(presets).map((mode) => (
        <div key={mode} className="flex w-full flex-col gap-2">
          <span className="font-mono text-[11px] text-ink/40">mode=&quot;{mode}&quot;</span>
          <div className="h-[260px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
            <Grid mode={mode as keyof typeof presets} nrCols={NR_COLS} gap={6} className="h-full w-full">
              {Array.from({ length: TILE_COUNT }, (_, i) => (
                <GridItem key={i}>
                  <Item index={i} caps={{ col: 0, row: 0 }} infoMode={infoMode} />
                </GridItem>
              ))}
            </Grid>
          </div>
        </div>
      ))}
    </div>
  </section>
);
