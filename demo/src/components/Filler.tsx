/** `fillComponent` for every example — the leftover-hole filler, styled distinctly from `Item`/
 * `Void` so it's clear which cells the grid filled itself vs. which an example placed. Shows its
 * merged rect (row/col/span) — `<Grid>` passes this in when `fillComponent` is a function, one call
 * per merged gap (see `groupEmptyRects`), so this is the gap's real shape, not a per-cell guess.
 * Ported from dev's `Filler.tsx`, restyled onto demo's theme. */
export const Filler = ({
  row,
  col,
  rowSpan,
  colSpan,
}: {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}) => (
  <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-black/10 text-center font-mono text-[10px] text-ink/25">
    ({row},{col}) {colSpan}×{rowSpan}
  </div>
);
