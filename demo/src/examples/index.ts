import type { ExampleEntry } from '@/typing';
import { pinnedSpansExample } from './pinned-spans';
import { propMatrixExample } from './prop-matrix';
import { RowHeightExample } from './row-height';
import { OrganicMosaicExample } from './organic-mosaic';

/** Every example, in render order — the shell (`App.tsx`) maps this to sections, and
 * `scripts/dev-report-grid.ts` imports this same array for its QA report, so there's exactly one
 * definition of each example's setup. Static examples (`prop-matrix`, `pinned-spans`,
 * `organic-mosaic`) are plain `Example` data; `row-height` is the one interactive example (see the
 * merge plan's "interactivity gap"). `organic-mosaic` runs last — "after the basic examples, add
 * organic in full fashion". */
export const examples: ExampleEntry[] = [
  { kind: 'data', example: propMatrixExample },
  { kind: 'component', title: 'rowHeight — auto vs. fixed', Component: RowHeightExample },
  { kind: 'data', example: pinnedSpansExample },
  { kind: 'component', title: 'organic mosaic', Component: OrganicMosaicExample },
];
