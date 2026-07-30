import { GripVertical } from 'lucide-react';
import { useRef, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { CaseFrame } from '@/showcase/Case';
import { useWidth } from '@/showcase/hooks';
import { FLIP_TRANSITION } from '@/showcase/motion';
import type { Case } from '@/showcase/types';
import { Tile } from '../tiles';

const TILES = 22;
const WIDE = new Set([2, 9, 15]);
const GAP = 6;
// the handle straddles the right edge of the grid; the stage clips, so reserve its half-width
const HANDLE_HALF = 16;
const MIN_WIDTH = 240;

/** Breakpoints, in the one place they exist: `nrCols`. */
const colsFor = (w: number) => (w < 380 ? 2 : w < 560 ? 3 : w < 760 ? 5 : 8);

/** Drag the stage narrower and `nrCols` drops with it, so the same children in the same order
 * resolve into a different layout. A toggle would have been half the code and none of the point —
 * what's worth feeling here is the continuity between two widths, not two screenshots. */
function Responsive() {
  const hostRef = useRef<HTMLDivElement>(null);
  const measured = useWidth(hostRef);
  const max = Math.max(MIN_WIDTH, measured - HANDLE_HALF);
  const [dragged, setDragged] = useState<number | null>(null);
  const [isDragging, setDragging] = useState(false);

  const w = Math.min(dragged ?? max, max);
  const nrCols = colsFor(w);
  // square cells, so a column drop reads as a reflow rather than as tiles changing shape
  const rowHeight = (w - (nrCols - 1) * GAP) / nrCols;

  const onDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    const left = hostRef.current?.getBoundingClientRect().left ?? 0;
    const move = (ev: PointerEvent) => setDragged(Math.max(MIN_WIDTH, Math.min(max, ev.clientX - left)));
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
      {/* h-full, so the handle below can be positioned against the *stage* rather than against the
          grid: narrow widths make the grid several times taller than the stage, and a handle
          centred on the grid then sits far below the visible area. */}
      <div ref={hostRef} className="relative h-full">
        {/* nothing until the stage has been measured — a first paint at the 240px floor would
            reflow the whole grid one frame later */}
        <div style={{ width: w, visibility: measured ? undefined : 'hidden' }}>
          <Grid nrCols={nrCols} gap={GAP} rowHeight={rowHeight} animateSize itemAnimation={FLIP_TRANSITION}>
            {Array.from({ length: TILES }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
              <GridItem key={i} cols={WIDE.has(i) ? Math.min(2, nrCols) : undefined} weight={1}>
                <Tile n={i} accent={WIDE.has(i)} label={WIDE.has(i) ? 'cols 2' : undefined} />
              </GridItem>
            ))}
          </Grid>
        </div>

        {/* The handle. Inked rather than grey: a hairline nobody notices is a control nobody finds,
            and this is the only case whose whole point is an interaction. */}
        <div className="pointer-events-none absolute inset-y-0 left-0" style={{ width: w }}>
          <button
            type="button"
            aria-label="Resize stage"
            onPointerDown={onDrag}
            className="group pointer-events-auto absolute inset-y-0 -right-4 w-8 cursor-ew-resize touch-none bg-transparent"
          >
            <span className="absolute inset-y-0 left-1/2 w-px bg-accent" />
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
  title: 'Responsive',
  lede: 'There is no second layout to maintain: a breakpoint sets nrCols, and the same children in the same order re-resolve against it. Pinned spans are clamped to the column count, so a cols 2 tile still fits a 2-column grid.',
  props: ['nrCols', 'cols'],
  Component: Responsive,
};
