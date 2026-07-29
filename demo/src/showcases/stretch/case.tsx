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
 * could reach is left for `fillComponent`. The strict tiles in this dataset box in enough space
 * that both mechanisms have visible work to do across the cap's whole range. */
function Stretch() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, NR_COLS, GAP);
  const stretch = values.stretch === CAP_MAX ? Number.POSITIVE_INFINITY : values.stretch;

  return (
    <CaseFrame height="auto" controls={panel}>
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
  title: 'Nothing left over',
  lede: 'Raise the cap and elastic tiles absorb the gaps around them, split evenly between neighbours. Whatever stays boxed in is merged into rectangles and handed to fillComponent.',
  props: ['stretch', 'fillComponent'],
  Component: Stretch,
};
