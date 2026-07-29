import { type RefObject, useEffect, useState } from 'react';

/** Observed content width of an element, or 0 before the first measurement. */
export function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** A `rowHeight` that makes cells square.
 *
 * `rowHeight="auto"` divides the *container height* into bands, which is right when a grid has to
 * fit a box but wrong for a specimen: with few rows it stretches every tile into a tall sliver and
 * `weight={2}` stops looking like twice as much. Columns are the axis fixed by `nrCols`, so a
 * square cell is just the measured column width — one ResizeObserver, no layout thrash. */
export function useSquareRows(ref: RefObject<HTMLElement | null>, nrCols: number, gap: number) {
  const width = useWidth(ref);
  return width ? (width - (nrCols - 1) * gap) / nrCols : ('auto' as const);
}
