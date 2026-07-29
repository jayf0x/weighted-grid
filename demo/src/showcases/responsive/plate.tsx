import { useEffect, useRef, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { PlateFrame } from '@/showcase/Plate';
import type { Plate } from '@/showcase/types';
import { Tile } from '../tiles';

const TILES = 22;
const WIDE = new Set([2, 9, 15]);
const GAP = 6;

/** Real breakpoints, not a checkbox pretending to be one: drag the handle and the stage genuinely
 * narrows, `nrCols` drops with it, and the same children reflow. A toggle would have been half the
 * code and none of the point — the thing worth feeling here is continuity, not two screenshots. */
function Responsive() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [max, setMax] = useState(1200);
  const [isDragging, setDragging] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setMax(w);
      setWidth((cur) => (cur === null ? w : Math.min(cur, w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = width ?? max;
  const nrCols = w < 380 ? 2 : w < 560 ? 3 : w < 760 ? 5 : 8;
  // square cells, so a column drop reads as a reflow rather than as tiles changing shape
  const rowHeight = w ? (w - (nrCols - 1) * GAP) / nrCols : 'auto';

  const onDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    const left = hostRef.current?.getBoundingClientRect().left ?? 0;
    const move = (ev: PointerEvent) => setWidth(Math.max(240, Math.min(max, ev.clientX - left)));
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <PlateFrame
      height="auto"
      controls={
        <div>
          <div className="flex items-baseline justify-between">
            <span className="spec">measured</span>
            <span className="font-mono text-[13px] tabular-nums text-ink">
              {Math.round(w)}
              <span className="text-ink-3">px</span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-rule pt-3">
            <span className="spec">nrCols</span>
            <span className="font-mono text-[13px] tabular-nums text-accent">{nrCols}</span>
          </div>
          <p className="mt-5 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            Drag the right edge of the stage. One prop changes; there is no second layout to maintain, no mobile branch,
            and source order is identical at every width.
          </p>
        </div>
      }
    >
      <div ref={hostRef}>
        <div className="relative" style={{ width: width ?? '100%' }}>
          <Grid nrCols={nrCols} gap={GAP} rowHeight={rowHeight} animateSize animatePosition>
            {Array.from({ length: TILES }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
              <GridItem key={i} cols={WIDE.has(i) ? Math.min(2, nrCols) : undefined} weight={1}>
                <Tile n={i} accent={WIDE.has(i)} />
              </GridItem>
            ))}
          </Grid>

          {/* the handle: a ruled edge you can grab, not an OS resize corner */}
          <button
            type="button"
            aria-label="Resize stage"
            onPointerDown={onDrag}
            className="absolute top-0 -right-3 h-full w-6 cursor-ew-resize touch-none bg-transparent"
          >
            <span
              className={
                'absolute top-0 left-1/2 h-full w-px transition-colors duration-200 ' +
                (isDragging ? 'bg-accent' : 'bg-rule-strong hover:bg-accent')
              }
            />
            <span
              className={
                'absolute top-1/2 left-1/2 h-8 w-[3px] -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 ' +
                (isDragging ? 'bg-accent' : 'bg-ink-3')
              }
            />
          </button>
        </div>
      </div>
    </PlateFrame>
  );
}

export const plate: Plate = {
  id: 'responsive',
  title: 'One prop, every width',
  lede: 'Responsiveness is a column count. Feed nrCols from a breakpoint and the same children, in the same order, resolve into a layout that suits the width.',
  props: ['nrCols'],
  Component: Responsive,
};
