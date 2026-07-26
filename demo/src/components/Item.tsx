import type { GridItemProps } from 'weighted-grid/react';
import type { InfoMode } from '@/typing';
import { formatCaps, formatSpanProps } from '@/utils/debugLabel';
import { tintFor } from '@/utils/colors';

export type { InfoMode };

type ItemProps = Omit<GridItemProps, 'children'> & {
  index: number;
  caps: { col: number; row: number };
  infoMode: InfoMode;
  label?: string;
};

/** Real-content tile body — the one `Item` for the whole app, `infoMode` toggling between the two
 * treatments that used to be two separate components (demo's `Block.jsx` and dev's `Item.tsx`):
 *
 * - `simple` (default): quiet tint + index/dims, no span math — today's public demo.
 * - `dev`: index, the `GridItem` args that produced its span (`formatSpanProps`), and the
 *   *effective* stretch cap `<Grid>` actually applied (`caps`, from `stretchCapsOf` — resolves the
 *   cols/rows pin and any stretch/stretchX/stretchY override the same way the grid does) — today's
 *   dev QA app, kept as a monospace/opacity treatment but on demo's palette instead of a separate
 *   QA-colored background.
 *
 * Render inside a `<GridItem>` — `<Grid>` only recognizes `GridItem` as a *direct* child. */
export const Item = ({ index, caps, infoMode, label, ...spanProps }: ItemProps) => {
  if (infoMode === 'dev') {
    return (
      <div className="rect-enter flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-md border border-black/[0.04] bg-panel p-1 text-center font-mono text-[10px] text-ink/50">
        <span>{index}) </span>
        <span>{formatSpanProps(spanProps)}</span>
        <span className="text-ink/30">{formatCaps(caps)}</span>
      </div>
    );
  }

  if (label) {
    return (
      <div className="rect-enter flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-md bg-accent text-sm font-medium tracking-tight text-white">
        <span>{label}</span>
        {spanProps.weight != null && <span className="text-[11px] font-normal opacity-80">{spanProps.weight}×</span>}
      </div>
    );
  }

  return (
    <div
      className="rect-enter flex h-full w-full items-center justify-center rounded-md border border-black/[0.04] font-mono text-[11px] text-ink/40"
      style={{ background: tintFor(index), animationDelay: `${Math.min(index, 24) * 10}ms` }}
    >
      {index}
    </div>
  );
};
