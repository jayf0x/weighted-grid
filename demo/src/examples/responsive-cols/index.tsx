import { useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import type { InfoMode, PlateInfo } from '@/typing';
import { ComponentHeader } from '@/components/ComponentHeader';
import { CornerTicks } from '@/components/CornerTicks';
import { Item } from '@/components/Item';
import { useIsMobile } from '@/utils/hooks';
import { useSectionControls } from '@/utils/controlsRail';

const TILE_COUNT = 20;
const NR_COLS_DESKTOP = 8;
const NR_COLS_MOBILE = 3;
// A few wide tiles so the reflow (not just "smaller squares") is visible between column counts.
const WIDE_INDEXES = new Set([2, 9, 14]);

type ViewportOverride = 'auto' | 'mobile' | 'desktop';

const VIEWPORT_OPTIONS: { label: string; value: ViewportOverride }[] = [
  { label: 'Auto (real width)', value: 'auto' },
  { label: 'Force mobile', value: 'mobile' },
  { label: 'Force desktop', value: 'desktop' },
];

/** One `<Grid>`, one prop (`nrCols`) driven by a breakpoint — same placement engine, no separate
 * "mobile layout" to hand-author. The rail's viewport override exists purely so the effect is
 * visible without resizing the actual browser window. */
export function ResponsiveColsExample({ infoMode, plate }: { infoMode: InfoMode; plate: PlateInfo }) {
  const isMobileReal = useIsMobile();
  const [override, setOverride] = useState<ViewportOverride>('auto');
  const isMobile = override === 'auto' ? isMobileReal : override === 'mobile';
  const nrCols = isMobile ? NR_COLS_MOBILE : NR_COLS_DESKTOP;

  const controls = (
    <>
      <div className="flex flex-col gap-1.5">
        {VIEWPORT_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-[13px] text-ink/60">
            <input
              type="radio"
              name="viewport-override"
              checked={override === opt.value}
              onChange={() => setOverride(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
      <p className="text-[13px] leading-relaxed text-ink/40">
        <span className="font-mono text-ink/70">nrCols={nrCols}</span> because the viewport reads as{' '}
        {isMobile ? 'narrow' : 'wide'}. Same tiles, same source order — just fewer columns.
      </p>
    </>
  );
  const ref = useSectionControls<HTMLElement>('responsive-cols', controls);

  return (
    <section ref={ref} className="flex flex-col gap-3">
      <ComponentHeader title="responsive — fewer columns on mobile" plate={plate} />
      <div className="relative">
        <CornerTicks />
        <div className="h-[420px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
          <Grid nrCols={nrCols} gap={6} className="h-full w-full">
            {Array.from({ length: TILE_COUNT }, (_, i) => (
              <GridItem key={i} cols={WIDE_INDEXES.has(i) ? 2 : undefined}>
                <Item index={i} caps={{ col: 0, row: 0 }} infoMode={infoMode} />
              </GridItem>
            ))}
          </Grid>
        </div>
      </div>
    </section>
  );
}
