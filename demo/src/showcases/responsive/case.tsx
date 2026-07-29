import { GripVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { CaseFrame } from '@/showcase/Case';
import { FLIP_TRANSITION } from '@/showcase/motion';
import type { Case } from '@/showcase/types';
import { Tile } from '../tiles';

const TILES = 22;
const WIDE = new Set([2, 9, 15]);
const GAP = 6;
// the handle straddles the stage's right edge; the stage clips, so reserve its half-width
const HANDLE_HALF = 16;

/** Real breakpoints, not a checkbox pretending to be one: drag the handle and the stage genuinely
 * narrows, `nrCols` drops with it, and the same children reflow. A toggle would have been half the
 * code and none of the point — what's worth feeling here is continuity, not two screenshots. */
function Responsive() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [max, setMax] = useState(1200);
  const [isDragging, setDragging] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width - HANDLE_HALF;
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
    <CaseFrame
      controls={
        <div>
          <p className="mb-4 flex items-center gap-2 border border-accent/40 bg-accent-soft px-3 py-2.5 text-[13px] text-accent">
            <GripVertical className="size-4 shrink-0" />
            Drag the orange edge of the stage.
          </p>
          <div className="flex items-baseline justify-between border-t border-rule pt-3">
            <span className="spec">measured</span>
            <span className="font-mono text-[13px] text-ink tabular-nums">
              {Math.round(w)}
              <span className="text-ink-3">px</span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-rule pt-3">
            <span className="spec">nrCols</span>
            <span className="font-mono text-[13px] text-accent tabular-nums">{nrCols}</span>
          </div>
        </div>
      }
    >
      <div ref={hostRef}>
        <div className="relative" style={{ width: width ?? '100%' }}>
          <Grid nrCols={nrCols} gap={GAP} rowHeight={rowHeight} animateSize itemAnimation={FLIP_TRANSITION}>
            {Array.from({ length: TILES }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
              <GridItem key={i} cols={WIDE.has(i) ? Math.min(2, nrCols) : undefined} weight={1}>
                <Tile n={i} accent={WIDE.has(i)} />
              </GridItem>
            ))}
          </Grid>

          {/* The handle. Inked rather than grey: a hairline nobody notices is a control nobody
              finds, and this is the only case whose whole point is an interaction. */}
          <button
            type="button"
            aria-label="Resize stage"
            onPointerDown={onDrag}
            className="group absolute top-0 -right-4 h-full w-8 cursor-ew-resize touch-none bg-transparent"
          >
            <span className="absolute top-0 left-1/2 h-full w-px bg-accent" />
            <span
              className={
                'absolute top-1/2 left-1/2 flex h-12 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-paper transition-transform duration-200 ease-out-quart ' +
                (isDragging ? 'scale-110 bg-accent' : 'bg-accent group-hover:scale-110')
              }
            >
              <GripVertical className="size-3.5" />
            </span>
          </button>
        </div>
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: 'responsive',
  title: 'One prop, every width',
  lede: 'Responsiveness is a column count. Feed nrCols from a breakpoint and the same children, in the same order, resolve into a layout that suits the width — no second layout to maintain.',
  props: ['nrCols'],
  Component: Responsive,
};
