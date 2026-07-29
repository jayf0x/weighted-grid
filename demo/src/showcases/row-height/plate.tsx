import { Grid, GridItem } from 'weighted-grid/react';
import { range, segment, useControls } from '@/showcase/controls';
import { PlateFrame } from '@/showcase/Plate';
import type { Plate } from '@/showcase/types';
import { Void } from '../tiles';

const PHOTOS = Array.from({ length: 10 }, (_, i) => `${import.meta.env.BASE_URL}organic/img-${i}.jpg`);

// pinned spans, so the plate is about row *height* and not about weights again
const SHAPES = [
  { cols: 4, rows: 3 },
  { cols: 2, rows: 2 },
  { cols: 2, rows: 2 },
  { cols: 3, rows: 2 },
  { cols: 3, rows: 3 },
  { cols: 2, rows: 2 },
  { cols: 4, rows: 2 },
  { cols: 2, rows: 3 },
  { cols: 3, rows: 2 },
  { cols: 3, rows: 2 },
];

const SCHEMA = {
  mode: segment('rowHeight', 'auto', ['auto', 'fixed'] as const),
  px: range('fixed row', 44, { min: 24, max: 96, unit: 'px' }),
};

/** The one escape hatch from pure proportion. `auto` divides the parent's height into row bands —
 * the grid fits a box. A px value fixes each row and the grid grows downward instead. */
function RowHeight() {
  const { values, panel } = useControls(SCHEMA);
  const isAuto = values.mode === 'auto';

  return (
    <PlateFrame
      height="auto"
      controls={
        <>
          {panel}
          <p className="mt-5 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            {isAuto
              ? 'The stage has a height; the grid splits it into row bands and always fits.'
              : `Rows are ${values.px}px tall regardless of the stage, so the grid overflows it — the mode for feeds and pages that scroll.`}
          </p>
        </>
      }
    >
      <div className={isAuto ? 'h-[min(62vh,34rem)]' : 'h-[min(62vh,34rem)] overflow-y-auto'}>
        {/* every tile pins both axes, so nothing can stretch — the leftovers are hatched rather
            than left blank, which is what `fillComponent` is for */}
        <Grid nrCols={10} gap={6} rowHeight={isAuto ? 'auto' : values.px} fillComponent={<Void />} animateSize>
          {SHAPES.map((shape, i) => (
            <GridItem key={PHOTOS[i]} {...shape}>
              <figure className="group relative h-full w-full overflow-hidden border border-rule bg-sunk">
                <img
                  src={PHOTOS[i]}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-[scale,filter] duration-700 ease-plate group-hover:scale-[1.03] contrast-[1.05] saturate-[0.55] group-hover:saturate-100"
                />
                <figcaption className="spec absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-2 text-white/80">
                  {shape.cols}×{shape.rows}
                </figcaption>
              </figure>
            </GridItem>
          ))}
        </Grid>
      </div>
    </PlateFrame>
  );
}

export const plate: Plate = {
  id: 'row-height',
  title: 'Fit, or flow',
  lede: 'rowHeight="auto" splits the container height into bands so the grid always fits its box. Give it a px value and rows keep that height while the grid grows downward.',
  props: ['rowHeight'],
  Component: RowHeight,
};
