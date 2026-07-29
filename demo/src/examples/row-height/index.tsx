import { useMemo, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { ComponentHeader } from '@/components/ComponentHeader';
import { Controls, type Weights } from '@/components/Controls';
import { CornerTicks } from '@/components/CornerTicks';
import { Item } from '@/components/Item';
import type { InfoMode, PlateInfo } from '@/typing';
import { buildBlocks } from '@/utils/blocks';
import { useSectionControls } from '@/utils/controlsRail';
// Dev-only: see ExampleSection.tsx for why this reaches past the public entry points.
import { stretchCapsOf } from '../../../../src/core';

const FillerTile = () => (
  <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-black/10 text-[10px] text-ink/25">
    fillComponent
  </div>
);

/** One labeled Grid instance. Pass `rowHeight` ("auto" or a px number) to switch between the two
 * vertical flows the library offers — the caption below always explains what that does here.
 * Ported from demo's `DemoPanel.jsx`. */
function Panel({
  title,
  caption,
  blocks,
  nrCols,
  rowHeight,
  gap,
  stretch,
  showGrid,
  fillGaps,
  infoMode,
}: {
  title: string;
  caption: string;
  blocks: ReturnType<typeof buildBlocks>;
  nrCols: number;
  rowHeight: 'auto' | number;
  gap: number;
  stretch: number;
  showGrid: boolean;
  fillGaps: boolean;
  infoMode: InfoMode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">{title}</h2>
      <div className="relative">
        <CornerTicks />
        <div
          className="h-[380px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5"
          style={{ resize: rowHeight === 'auto' ? 'vertical' : 'none' }}
        >
          <Grid
            nrCols={nrCols}
            gap={gap}
            rowHeight={rowHeight}
            stretch={stretch}
            showGrid={showGrid}
            fillComponent={fillGaps ? <FillerTile /> : undefined}
            className="h-full w-full"
          >
            {blocks.map((b) => (
              <GridItem key={b.i} weight={b.weight}>
                <Item
                  index={b.i}
                  weight={b.weight}
                  label={b.label}
                  infoMode={infoMode}
                  caps={stretchCapsOf({ weight: b.weight }, stretch)}
                />
              </GridItem>
            ))}
          </Grid>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-ink/40">{caption}</p>
    </section>
  );
}

/** The one interactive example (see the merge plan's "interactivity gap") — auto vs. fixed
 * `rowHeight`, driven by a shared `Controls` bar that now lives in the rail instead of stacked
 * above the panels. Ported from demo's `App.jsx` state + its two `DemoPanel` instances. */
export function RowHeightExample({ infoMode, plate }: { infoMode: InfoMode; plate: PlateInfo }) {
  const [count, setCount] = useState(20);
  const [nrCols, setNrCols] = useState(7);
  const [weights, setWeights] = useState<Weights>({ A: 3, B: 5, C: 2 });
  const setWeight = (label: keyof Weights, value: number) => setWeights((w) => ({ ...w, [label]: value }));

  const [gap, setGap] = useState(6);
  const [stretch, setStretch] = useState(Number.POSITIVE_INFINITY);
  const [showGrid, setShowGrid] = useState(false);
  const [fillGaps, setFillGaps] = useState(false);

  const blocks = useMemo(() => buildBlocks(count, weights), [count, weights]);

  const controls = (
    <Controls
      count={count}
      setCount={setCount}
      nrCols={nrCols}
      setNrCols={setNrCols}
      weights={weights}
      setWeight={setWeight}
      gap={gap}
      setGap={setGap}
      stretch={stretch}
      setStretch={setStretch}
      showGrid={showGrid}
      setShowGrid={setShowGrid}
      fillGaps={fillGaps}
      setFillGaps={setFillGaps}
    />
  );
  const ref = useSectionControls<HTMLDivElement>('row-height', controls);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <ComponentHeader title="rowHeight — auto vs. fixed" plate={plate} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title='rowHeight="auto" — stretches to fill'
          caption="Rows split the container's height. Drag the bottom-right corner; it reflows with zero re-pack."
          blocks={blocks}
          nrCols={nrCols}
          rowHeight="auto"
          gap={gap}
          stretch={stretch}
          showGrid={showGrid}
          fillGaps={fillGaps}
          infoMode={infoMode}
        />
        <Panel
          title="rowHeight={72} — flows down"
          caption="Same placement, but each row is a fixed 72px and the grid grows downward instead."
          blocks={blocks}
          nrCols={nrCols}
          rowHeight={72}
          gap={gap}
          stretch={stretch}
          showGrid={showGrid}
          fillGaps={fillGaps}
          infoMode={infoMode}
        />
      </div>
    </div>
  );
}
