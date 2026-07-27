import { Grid, GridItem } from 'weighted-grid/react';
import { masonPreset, organicPreset, type PresetFn } from 'weighted-grid/presets';
import { Item } from '@/components/Item';
import type { InfoMode } from '@/typing';

const TILE_COUNT = 18;
const NR_COLS = 8;

const PRESETS: Record<string, PresetFn> = { masonPreset: masonPreset(), organicPreset: organicPreset() };

/** One small labeled grid per preset. Deliberately tiny (fixed height, few tiles): the point is
 * "what does this preset do to plain, prop-less items", not a full showcase. */
export const ModesExample = ({ infoMode }: { infoMode: InfoMode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">
      preset — auto-assigned weight/cols/rows per item
    </h2>
    <div className="flex flex-wrap gap-4">
      {Object.entries(PRESETS).map(([name, preset]) => (
        <div key={name} className="flex w-full flex-col gap-2">
          <span className="font-mono text-[11px] text-ink/40">preset={name}</span>
          <div className="h-[260px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
            <Grid preset={preset} nrCols={NR_COLS} gap={6} className="h-full w-full">
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
