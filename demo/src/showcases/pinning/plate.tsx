import { useRef } from 'react';
import { range, toggle, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import { PlateFrame } from '@/showcase/Plate';
import type { Plate } from '@/showcase/types';
import { DataGrid } from '../DataGrid';
import { propMatrix } from '../report';

const SCHEMA = {
  nrCols: range('columns', 10, { min: 6, max: 16 }),
  gap: range('gap', 5, { min: 0, max: 20, unit: 'px' }),
  showGrid: toggle('guide lines', false),
};

/** The reference plate: every combination of pinned and elastic axes, side by side, so the
 * per-axis rule is visible rather than described. Read the labels — `2c` never widens, `w3` does. */
function Pinning() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, values.nrCols, values.gap);
  return (
    <PlateFrame
      height="auto"
      controls={
        <>
          {panel}
          <p className="mt-5 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            Labels read <span className="font-mono text-ink-2">c</span> = pinned columns,{' '}
            <span className="font-mono text-ink-2">r</span> = pinned rows,{' '}
            <span className="font-mono text-ink-2">w</span> = weight. The last four tiles pin both axes, so their
            weights are ignored entirely.
          </p>
        </>
      }
    >
      <div ref={stageRef}>
        <DataGrid
          data={propMatrix}
          nrCols={values.nrCols}
          gap={values.gap}
          rowHeight={rowHeight}
          showGrid={values.showGrid}
        />
      </div>
    </PlateFrame>
  );
}

export const plate: Plate = {
  id: 'pinning',
  title: 'Pin an axis',
  lede: 'cols and rows freeze one axis at an exact span while weight keeps driving the other. Elasticity is per axis, not per item — pin both and the tile is strict.',
  props: ['cols', 'rows', 'weight', 'showGrid'],
  Component: Pinning,
};
