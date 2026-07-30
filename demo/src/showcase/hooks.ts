import { type RefObject, useEffect, useState } from 'react';

/** Observed content box of an element, `{ width: 0, height: 0 }` before the first measurement. */
export function useBox(ref: RefObject<HTMLElement | null>) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

/** Observed content width of an element, or 0 before the first measurement. */
export const useWidth = (ref: RefObject<HTMLElement | null>) => useBox(ref).width;

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

/** How many rows of *roughly* square cells fit the measured box; 0 before the first measurement.
 *
 * The other half of `useSquareRows`, for a case that has to fill its stage exactly rather than
 * overflow it: keep `rowHeight="auto"` (the grid then divides the stage height, so there's no
 * leftover strip at the bottom) and hand it this many rows, so a band ends up about as tall as a
 * column is wide. */
export function useSquareRowCount(ref: RefObject<HTMLElement | null>, nrCols: number, gap: number, min = 2) {
  const { width, height } = useBox(ref);
  if (!width || !height) return 0;
  const cell = (width - (nrCols - 1) * gap) / nrCols;
  return Math.max(min, Math.round((height + gap) / (cell + gap)));
}
