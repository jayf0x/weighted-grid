import { useRef } from 'react';
import { CaseFrame } from '@/showcase/Case';
import { range, toggle, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import type { Case } from '@/showcase/types';
import { DataGrid } from '../DataGrid';
import { pinnedSpans } from '../report';
import { Filler } from '../tiles';

const CAP_MAX = 6;
const NR_COLS = pinnedSpans.meta.nrCols ?? 8;
const GAP = 6;

const SCHEMA = {
  // opens at 0 — every hole visible — so the first drag of the slider *is* the demonstration
  stretch: range('stretch cap', 0, {
    min: 0,
    max: CAP_MAX,
    format: (v) => (v === CAP_MAX ? '∞' : String(v)),
  }),
  fill: toggle('fillComponent', true),
  showGrid: toggle('guide lines', false),
};

/** Dead zones, in one pass: elastic axes grow into the gaps first, fairly, and only what nothing
 * could reach is left for `fillComponent`. The dataset is tuned (see `report.ts`) so that *every*
 * step of the cap closes something the step below it couldn't, and a handful of boxed-in cells
 * survive even at ∞ — otherwise half this control would be decoration. */
function Stretch() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, NR_COLS, GAP);
  const stretch = values.stretch === CAP_MAX ? Number.POSITIVE_INFINITY : values.stretch;

  return (
    <CaseFrame controls={panel}>
      <div ref={stageRef}>
        <DataGrid
          data={pinnedSpans}
          stretch={stretch}
          showGrid={values.showGrid}
          fillComponent={values.fill ? <Filler label="fill" /> : undefined}
          rowHeight={rowHeight}
        />
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: 'stretch',
  title: 'Stretch',
  lede: 'Empty cells, in one pass. Elastic tiles grow into the gaps beside them — up to stretch cells each, split evenly between the tiles flanking a gap. What no elastic neighbour can reach is merged into rectangles and handed to fillComponent.',
  props: ['stretch', 'fillComponent', 'showGrid'],
  Component: Stretch,
};
