import { useRef } from 'react';
import { range, toggle, useControls } from '@/showcase/controls';
import { useSquareRows } from '@/showcase/hooks';
import { PlateFrame } from '@/showcase/Plate';
import type { Plate } from '@/showcase/types';
import { DataGrid } from '../DataGrid';
import { pinnedSpans } from '../report';
import { Filler } from '../tiles';

const CAP_MAX = 9;

const SCHEMA = {
  stretch: range('stretch cap', CAP_MAX, {
    min: 0,
    max: CAP_MAX,
    format: (v) => (v === CAP_MAX ? '∞' : String(v)),
  }),
  fill: toggle('fillComponent', false),
  showGrid: toggle('guide lines', false),
};

/** Dead zones, in one pass: elastic axes grow into the gaps first (fairly, split between the tiles
 * flanking a hole), and only what nothing could reach is left for `fillComponent`. Drag the cap
 * from ∞ to 0 and watch the two mechanisms trade places. */
function Stretch() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, pinnedSpans.meta.nrCols ?? 6, 6);
  const stretch = values.stretch === CAP_MAX ? Number.POSITIVE_INFINITY : values.stretch;

  return (
    <PlateFrame
      height="auto"
      controls={
        <>
          {panel}
          <p className="mt-5 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            At <span className="font-mono text-ink-2">0</span> nothing grows and every hole survives. Raise the cap and
            the flanking tiles absorb them, evenly — never all the growth to one side. Whatever is still boxed in is
            what <span className="font-mono text-ink-2">fillComponent</span> plugs.
          </p>
        </>
      }
    >
      <div ref={stageRef}>
        <DataGrid
          data={pinnedSpans}
          stretch={stretch}
          showGrid={values.showGrid}
          fillComponent={values.fill ? <Filler label="fill" /> : undefined}
          rowHeight={rowHeight}
        />
      </div>
    </PlateFrame>
  );
}

export const plate: Plate = {
  id: 'stretch',
  title: 'Nothing left over',
  lede: 'Gaps are resolved in one pass, not a mode switch: elastic axes stretch in first, then whatever is still unreachable gets merged into rectangles and handed to fillComponent.',
  props: ['stretch', 'fillComponent'],
  Component: Stretch,
};
