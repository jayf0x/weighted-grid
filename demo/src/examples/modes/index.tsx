import { Grid, GridItem } from 'weighted-grid/react';
import { masonPreset, organicPreset, type PresetFn } from 'weighted-grid/presets';
import { Item } from '@/components/Item';
import type { InfoMode, PlateInfo } from '@/typing';
import { ComponentHeader } from '@/components/ComponentHeader';
import { CornerTicks } from '@/components/CornerTicks';
import { useSectionControls } from '@/utils/controlsRail';

const TILE_COUNT = 18;
const NR_COLS = 8;

const PRESETS: Record<string, PresetFn> = { masonPreset: masonPreset(), organicPreset: organicPreset() };

const RAIL_NOTE = (
  <p className="text-[13px] leading-relaxed text-ink/40">
    Every tile below is a prop-less <span className="font-mono text-ink/70">{'<GridItem>'}</span> —
    the preset alone decides its weight/cols/rows.
  </p>
);

/** One small labeled grid per preset. Deliberately tiny (fixed height, few tiles): the point is
 * "what does this preset do to plain, prop-less items", not a full showcase. */
export const ModesExample = ({ infoMode, plate }: { infoMode: InfoMode; plate: PlateInfo }) => {
  const ref = useSectionControls<HTMLElement>('presets', RAIL_NOTE);

  return (
    <section ref={ref} className="flex flex-col gap-3">
      <ComponentHeader title="preset — auto-assigned weight/cols/rows per item" plate={plate} />
      <div className="flex flex-wrap gap-4">
        {Object.entries(PRESETS).map(([name, preset]) => (
          <div key={name} className="flex w-full flex-col gap-2">
            <span className="font-mono text-[11px] text-ink/40">preset={name}</span>
            <div className="relative">
              <CornerTicks />
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
          </div>
        ))}
      </div>
    </section>
  );
};
