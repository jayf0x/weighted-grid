/** How many single-cell tiles go before and after the block for it to land dead centre.
 *
 * Placement fills the first free cell in source order, so "put it at (row, col)" is just "put
 * `row * nrCols + col` single-cell tiles ahead of it", and the tiles after it fill everything it
 * didn't take — leaving no gap anywhere, which is why this case needs no `stretch`.
 *
 * Its own module, JSX-free, because it's the one part of the case that is arithmetic rather than
 * markup and `tests/demo-cases.test.ts` checks it against the real engine.
 */
export const mosaicCounts = (nrCols: number, nrRows: number, cols: number, rows: number) => {
  const before = Math.floor((nrRows - rows) / 2) * nrCols + Math.floor((nrCols - cols) / 2);
  return { before, after: Math.max(0, nrRows * nrCols - before - cols * rows) };
};
