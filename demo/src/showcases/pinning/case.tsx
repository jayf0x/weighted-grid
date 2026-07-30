import { useRef } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { CaseFrame } from '@/showcase/Case';
import { range, segment, toggle, useControls } from '@/showcase/controls';
import { useSquareRowCount } from '@/showcase/hooks';
import { FLIP_TRANSITION } from '@/showcase/motion';
import type { Case } from '@/showcase/types';
import { Tile } from '../tiles';
import { mosaicCounts } from './centre';

const GAP = 6;
/** The block's pinned span. 4×3 on purpose: not a square, so `weight` can't express it. */
const PIN = { cols: 4, rows: 3 };

const SCHEMA = {
  nrCols: range('detail', 8, { min: 6, max: 14 }),
  block: segment('centre block', 'cols + rows', ['cols + rows', 'weight'] as const),
  showGrid: toggle('guide lines', false),
};

/** One block, dead centre, against a mosaic of `weight={1}` tiles.
 *
 * The centring is arithmetic, not a placement prop: placement fills the first free cell in source
 * order, so putting exactly `row * nrCols + col` single-cell tiles ahead of the block lands it on
 * the cell we want, and the tiles after it fill whatever the block didn't take. `rowHeight="auto"`
 * plus a measured row count keeps the mosaic filling the stage exactly at any detail level. */
function Pinning() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const nrRows = useSquareRowCount(stageRef, values.nrCols, GAP, PIN.rows + 2);

  const isPinned = values.block === 'cols + rows';
  const cols = Math.min(PIN.cols, values.nrCols);
  const rows = Math.min(PIN.rows, nrRows);
  // `weight` is one number, so the only alternative to a 4×3 pin is a 4×4 square — that's the point
  const span = isPinned ? { cols, rows } : { weight: cols };
  const { before, after } = mosaicCounts(values.nrCols, nrRows, cols, isPinned ? rows : cols);
  const mosaic = (offset: number, count: number) =>
    Array.from({ length: count }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: mosaic cells are positional — the index *is* the identity
      <GridItem key={offset + i} weight={1}>
        <Tile n={(offset + i) * 3} />
      </GridItem>
    ));

  return (
    <CaseFrame controls={panel}>
      <div ref={stageRef} className="h-full">
        {nrRows > 0 && (
          <Grid
            nrCols={values.nrCols}
            nrRows={nrRows}
            gap={GAP}
            showGrid={values.showGrid}
            animateSize
            itemAnimation={FLIP_TRANSITION}
          >
            {mosaic(0, before)}
            <GridItem key="block" {...span}>
              <Tile accent n={3} label={isPinned ? `cols ${cols} · rows ${rows}` : `weight ${cols}`} />
            </GridItem>
            {mosaic(before + 1, after)}
          </Grid>
        )}
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: 'pinning',
  title: 'Fixed spans',
  lede: 'cols and rows are an exact span, in cells. The centre block stays 4 × 3 at every detail level — a shape weight cannot express, since one number only makes squares. Everything around it is weight 1.',
  props: ['cols', 'rows', 'nrRows'],
  Component: Pinning,
};
