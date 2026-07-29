import type { ExampleEntry } from '@/typing';
import { ModesExample } from './modes';
import { OrganicRawExample } from './organic-raw';
import { OrganicStyledExample } from './organic-styled';
import { pinnedSpansExample } from './pinned-spans';
import { propMatrixExample } from './prop-matrix';
import { ResponsiveColsExample } from './responsive-cols';
import { RowHeightExample } from './row-height';

/** Every example, in render order — the shell (`App.tsx`) maps this to sections (each gets a
 * "PLATE 0N/0M" badge off its position here), and `scripts/dev/dev-report-grid.ts` imports this
 * same array for its QA report, so there's exactly one definition of each example's setup.
 *
 * Opens on the two organic examples — the most different-looking thing on the page — instead of
 * burying them at the end; `prop-matrix`/`pinned-spans` (the exhaustive/reference examples) keep
 * their exact `Example` data and relative order so `dev-report-grid.ts --case=N` addressing (which
 * indexes only the `kind: 'data'` entries) doesn't shift. */
export const examples: ExampleEntry[] = [
  { kind: 'component', title: 'organic mosaic — raw', Component: OrganicRawExample },
  { kind: 'component', title: 'organic mosaic — styled', Component: OrganicStyledExample },
  { kind: 'component', title: 'responsive — fewer columns on mobile', Component: ResponsiveColsExample },
  { kind: 'data', example: propMatrixExample },
  { kind: 'data', example: pinnedSpansExample },
  { kind: 'component', title: 'rowHeight — auto vs. fixed', Component: RowHeightExample },
  { kind: 'component', title: 'presets', Component: ModesExample },
];
