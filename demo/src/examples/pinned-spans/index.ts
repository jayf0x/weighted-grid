import type { Example } from '@/typing';

/** The default span grid: `cols`/`rows` give an item an exact span, plain `weight`-only items are
 * `weight`-sized squares, and the placement model fills the gaps around them. Ported from demo's
 * `PinnedExample.jsx` as static `Example` data — no bespoke tile markup, renders through the same
 * `ExampleSection`/`Item`/`Void` everything else does. */
export const pinnedSpansExample: Example = {
  title: 'span grid — exact cols/rows, mixed with weighted squares',
  meta: { nrCols: 6, gap: 6 },
  tiles: [
    { kind: 'item', cols: 3, rows: 2 },
    { kind: 'item', cols: 2 },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
    { kind: 'item' },
  ],
};
