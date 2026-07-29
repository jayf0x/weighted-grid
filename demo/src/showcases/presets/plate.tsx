import { useMemo, useRef } from 'react';
import { masonPreset, organicPreset } from 'weighted-grid/presets';
import { Grid, GridItem } from 'weighted-grid/react';
import { range, segment, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import { PlateFrame } from '@/showcase/Plate';
import type { Plate } from '@/showcase/types';
import { Tile } from '../tiles';

const SCHEMA = {
  preset: segment('preset', 'organic', ['organic', 'mason'] as const),
  nrCols: range('columns', 20, { min: 8, max: 32 }),
  count: range('tiles', 34, { min: 6, max: 72 }),
  seed: range('seed / brick', 3, { min: 1, max: 12 }),
  size: range('size', 5, { min: 4, max: 16, format: (v) => (v / 10).toFixed(1) }),
};

/** A preset is just `({ count, nrCols }) => Partial<GridItemProps>[]` — a function that writes the
 * per-item props you would otherwise type out. Two ship; the shape of the third is up to you. */
function Presets() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, values.nrCols, 6);

  // memoised because `<Grid>` re-runs the preset whenever the function identity changes
  const preset = useMemo(
    () =>
      values.preset === 'organic'
        ? organicPreset({ seed: values.seed, size: values.size / 10 })
        : masonPreset({ brick: 2 + (values.seed % 3) }),
    [values.preset, values.seed, values.size],
  );

  return (
    <PlateFrame
      height="auto"
      controls={
        <>
          {panel}
          <p className="mt-5 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            <span className="font-mono text-ink-2">organic</span> drifts through size tiers with seeded noise, so tiles
            come in runs rather than per-item static. <span className="font-mono text-ink-2">mason</span> is a
            running-bond brick — the seed picks its brick width instead.
          </p>
        </>
      }
    >
      <div ref={stageRef}>
        <Grid nrCols={values.nrCols} gap={6} rowHeight={rowHeight} preset={preset} animateSize animatePosition>
          {Array.from({ length: values.count }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
            <GridItem key={i}>
              <Tile n={i} accent={i % 9 === 4} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </PlateFrame>
  );
}

export const plate: Plate = {
  id: 'presets',
  title: 'Fill itself',
  lede: 'A preset assigns weight/cols/rows for you, so a grid of unconfigured children still lands as a considered mosaic. Explicit props on an item always win.',
  props: ['preset', 'organicPreset', 'masonPreset'],
  Component: Presets,
};
