import { useMemo, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { organicPreset } from 'weighted-grid/presets';
import type { InfoMode, PlateInfo } from '@/typing';
import { ComponentHeader } from '@/components/ComponentHeader';
import { CornerTicks } from '@/components/CornerTicks';
import { Slider } from '@/components/Slider';
import { vividTintFor } from '@/utils/colors';
import { useSectionControls } from '@/utils/controlsRail';

const NR_COLS = 40;
const COL_PX = 56;
const COUNT_MIN = 12;
const COUNT_MAX = 48;
const SEED_MIN = 1;
const SEED_MAX = 24;

const FlatTile = ({ index }: { index: number }) => (
  <div
    className="rect-enter flex h-full w-full items-center justify-center rounded-md font-mono text-[11px] text-white/85"
    style={{ background: vividTintFor(index), animationDelay: `${Math.min(index, 24) * 15}ms` }}
  >
    {index}
  </div>
);

/** Opener example: `organicPreset`, flat color, no images — and cropped into a short strip that
 * scrolls *sideways*, the one place on the page that isn't a vertical list. Same preset as
 * `organic-styled` right after it; this one is the "what shape does the algorithm make" read, that
 * one is "what does it look like with real content." */
export function OrganicRawExample({ plate }: { infoMode: InfoMode; plate: PlateInfo }) {
  const [count, setCount] = useState(26);
  const [seed, setSeed] = useState(7);
  const preset = useMemo(() => organicPreset({ seed, size: 0.6 }), [seed]);

  const controls = (
    <>
      <Slider label="Tiles" value={count} min={COUNT_MIN} max={COUNT_MAX} onInput={setCount} />
      <Slider label="Seed" value={seed} min={SEED_MIN} max={SEED_MAX} onInput={setSeed} />
      <p className="text-[13px] leading-relaxed text-ink/40">
        Scrolls <span className="font-mono text-ink/70">→</span>, not ↓ — a fixed-height strip, wide
        canvas. Everything else on this page scrolls down; this is the same engine, just cropped
        differently.
      </p>
    </>
  );
  const ref = useSectionControls<HTMLElement>('organic-raw', controls);

  return (
    <section ref={ref} className="flex flex-col gap-3">
      <ComponentHeader title="organic mosaic — raw" plate={plate} />
      <div className="relative">
        <CornerTicks />
        <div className="h-[300px] w-full overflow-x-auto overflow-y-hidden rounded-lg border border-line bg-panel p-1.5">
          <div style={{ width: NR_COLS * COL_PX, height: '100%' }}>
            <Grid nrCols={NR_COLS} rowHeight={COL_PX} gap={6} preset={preset} className="h-full w-full">
              {Array.from({ length: count }, (_, i) => (
                <GridItem key={i}>
                  <FlatTile index={i} />
                </GridItem>
              ))}
            </Grid>
          </div>
        </div>
      </div>
    </section>
  );
}
