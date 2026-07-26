/** `fillComponent` for every case — the leftover-hole filler, styled distinctly from `Item`/`Void`
 * so a screenshot makes clear which cells the grid filled itself vs. which a case placed. Shows its
 * merged rect (row/col/span) — `<Grid>` passes this in when `fillComponent` is a function, one call
 * per merged gap (see `groupEmptyRects`), so this is the gap's real shape, not a per-cell guess. */
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
  <div className="bg-fill w-full h-full text-[0.6rem]" id="filler">
    ({row},{col}) {colSpan}x{rowSpan}
  </div>
);
