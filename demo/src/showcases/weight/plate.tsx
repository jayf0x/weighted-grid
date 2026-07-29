import { useRef, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { range, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import { PlateFrame } from '@/showcase/Plate';
import type { Plate } from '@/showcase/types';
import { seededWeight } from '../seed';
import { Tile } from '../tiles';

const SCHEMA = {
  nrCols: range('columns', 9, { min: 3, max: 16 }),
  count: range('tiles', 30, { min: 4, max: 64 }),
  gap: range('gap', 6, { min: 0, max: 24, unit: 'px' }),
};

/** One number per item, and the grid works it out. Clicking a tile cycles its weight, which is the
 * whole point of the prop: nothing else about the layout is declared, and everything else moves. */
function Weight() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, values.nrCols, values.gap);
  // a 40px tile with a caption in it is just noise — labels appear once a cell can hold one
  const hasLabels = typeof rowHeight === 'number' && rowHeight >= 44;
  const [weights, setWeights] = useState<Record<number, number>>({});

  const weightOf = (i: number) => weights[i] ?? seededWeight(i);
  const cycle = (i: number) => setWeights((w) => ({ ...w, [i]: (weightOf(i) % 4) + 1 }));

  return (
    <PlateFrame
      height="auto"
      controls={
        <>
          {panel}
          <p className="mt-5 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            Click any tile to cycle its weight 1 → 4 — the ones you have touched stay inked. Every other tile re-flows
            around it; source order never changes.
          </p>
        </>
      }
    >
      <div ref={stageRef}>
        <Grid nrCols={values.nrCols} gap={values.gap} rowHeight={rowHeight} animateSize animatePosition>
          {Array.from({ length: values.count }, (_, i) => {
            const w = weightOf(i);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
              <GridItem key={i} weight={w}>
                <Tile
                  n={w - 1}
                  label={hasLabels ? `w${w}` : undefined}
                  accent={weights[i] !== undefined}
                  onClick={() => cycle(i)}
                />
              </GridItem>
            );
          })}
        </Grid>
      </div>
    </PlateFrame>
  );
}

export const plate: Plate = {
  id: 'weight',
  title: 'One number',
  lede: 'weight is flexbox flex, in two dimensions: how much of the grid do I get. Pin nothing and it drives both axes, so equal weights are equal squares.',
  props: ['weight', 'nrCols', 'gap'],
  Component: Weight,
};
