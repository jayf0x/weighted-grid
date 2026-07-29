import { useRef } from 'react';
import { CaseFrame } from '@/showcase/Case';
import { range, toggle, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import type { Case } from '@/showcase/types';
import { DataGrid } from '../DataGrid';
import { propMatrix } from '../report';

const SCHEMA = {
  nrCols: range('columns', 10, { min: 6, max: 16 }),
  gap: range('gap', 5, { min: 0, max: 20, unit: 'px' }),
  showGrid: toggle('guide lines', false),
};

/** The reference case: every combination of pinned and elastic axes, side by side, so the
 * per-axis rule is visible rather than described. Read the labels — `2c` never widens, `w3` does. */
function Pinning() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, values.nrCols, values.gap);
  return (
    <CaseFrame height="auto" controls={panel}>
      <div ref={stageRef}>
        <DataGrid
          data={propMatrix}
          nrCols={values.nrCols}
          gap={values.gap}
          rowHeight={rowHeight}
          showGrid={values.showGrid}
        />
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: 'pinning',
  title: 'Pin an axis',
  lede: 'cols and rows freeze one axis at an exact span while weight keeps driving the other. Labels read c for pinned columns, r for pinned rows, w for weight — pin both and weight is ignored.',
  props: ['cols', 'rows', 'weight', 'showGrid'],
  Component: Pinning,
};
