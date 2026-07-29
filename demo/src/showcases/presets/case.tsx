import { useMemo, useRef } from 'react';
import { masonPreset, organicPreset } from 'weighted-grid/presets';
import { Grid, GridItem } from 'weighted-grid/react';
import { CaseFrame } from '@/showcase/Case';
import { range, segment, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import type { Case } from '@/showcase/types';
import { Tile } from '../tiles';

// Fixed, not knobs: `nrCols`/`count`/`gap` are case 01's subject, and repeating them here would
// bury the two dials that actually belong to a preset.
const NR_COLS = 20;
const COUNT = 34;
const GAP = 6;

const SCHEMA = {
  preset: segment('preset', 'organic', ['organic', 'mason'] as const),
  seed: range('seed', 3, { min: 1, max: 12 }),
  size: range('size', 5, { min: 4, max: 16, format: (v) => (v / 10).toFixed(1) }),
};

/** Every tile below is `<GridItem>` with no props at all — the preset writes them. `organic` drifts
 * through size tiers with seeded noise so tiles arrive in runs; `mason` lays a running-bond brick,
 * where `seed` picks the brick width instead. */
function Presets() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, NR_COLS, GAP);

  // memoised because `<Grid>` re-runs the preset whenever the function identity changes
  const preset = useMemo(
    () =>
      values.preset === 'organic'
        ? organicPreset({ seed: values.seed, size: values.size / 10 })
        : masonPreset({ brick: 2 + (values.seed % 3) }),
    [values.preset, values.seed, values.size],
  );

  return (
    <CaseFrame controls={panel}>
      <div ref={stageRef}>
        <Grid nrCols={NR_COLS} gap={GAP} rowHeight={rowHeight} preset={preset} animateSize>
          {Array.from({ length: COUNT }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
            <GridItem key={i}>
              <Tile n={i} accent={i % 9 === 4} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: 'presets',
  title: 'Fill itself',
  lede: 'These tiles carry no props at all. A preset is a function that writes weight/cols/rows for you — seeded noise here, running-bond brick there — and anything you set explicitly still wins.',
  props: ['preset', 'organicPreset', 'masonPreset'],
  Component: Presets,
};
