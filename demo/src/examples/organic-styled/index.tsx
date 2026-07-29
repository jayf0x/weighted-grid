import { useMemo, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { organicPreset } from 'weighted-grid/presets';
import type { InfoMode, PlateInfo } from '@/typing';
import { ComponentHeader } from '@/components/ComponentHeader';
import { CornerTicks } from '@/components/CornerTicks';
import { Filler } from '@/components/Filler';
import { Slider } from '@/components/Slider';
import { useIsMobile } from '@/utils/hooks';
import { useSectionControls } from '@/utils/controlsRail';
import { Card } from './Card';

const COUNT_MIN = 16;
const COUNT_MAX = 40;
const SEED_MIN = 1;
const SEED_MAX = 24;

/** Same engine as `organic-raw`, real content this time — photo tiles, gradient captions, a
 * `fillComponent` filler for whatever the layout can't close. This is "what a real section built on
 * the grid could look like," not just a shape demo. */
export function OrganicStyledExample({ plate }: { infoMode: InfoMode; plate: PlateInfo }) {
  const isMobile = useIsMobile();
  const [count, setCount] = useState(30);
  const [seed, setSeed] = useState(42);
  const preset = useMemo(() => organicPreset({ seed }), [seed]);

  const controls = (
    <>
      <Slider label="Tiles" value={count} min={COUNT_MIN} max={COUNT_MAX} onInput={setCount} />
      <Slider label="Seed" value={seed} min={SEED_MIN} max={SEED_MAX} onInput={setSeed} />
      <p className="text-[13px] leading-relaxed text-ink/40">
        Same <span className="font-mono text-ink/70">organicPreset</span>, styled cards with a{' '}
        <span className="font-mono text-ink/70">fillComponent</span> catching the leftover gaps.
      </p>
    </>
  );
  const ref = useSectionControls<HTMLElement>('organic-styled', controls);

  return (
    <section ref={ref} className="flex flex-col gap-3">
      <ComponentHeader title="organic mosaic — styled" plate={plate} />
      <div className="relative">
        <CornerTicks />
        <div className="h-[900px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
          <Grid
            nrCols={isMobile ? 20 : 48}
            rowHeight={8}
            preset={preset}
            fillComponent={(rect) => <Filler {...rect} />}
            className="h-full w-full"
          >
            {Array.from({ length: count }, (_, i) => (
              <GridItem key={i}>
                <Card index={i} />
              </GridItem>
            ))}
          </Grid>
        </div>
      </div>
    </section>
  );
}
