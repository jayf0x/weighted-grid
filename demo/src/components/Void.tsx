import type { GridItemProps } from 'weighted-grid/react';
import type { InfoMode } from '@/typing';
import { formatCaps, formatSpanProps } from '@/utils/debugLabel';

type VoidProps = Omit<GridItemProps, 'children'> & {
  index: number;
  caps: { col: number; row: number };
  infoMode: InfoMode;
};

// Blueprint negative space — a faint diagonal hatch with hairline side rules. Ported from
// jayf0x.github.io's Showcase VoidTile; `--pattern-fg` is a themeable swatch off `--color-ink` (see
// style.css), not a hardcoded white. In `dev` infoMode the index/span/caps debug label from dev's
// `Void.tsx` overlays the hatch instead of staying purely decorative.
export const Void = ({ index, caps, infoMode, ...spanProps }: VoidProps) => (
  <div
    className="relative h-full w-full rounded-[10px] border-x border-x-(--pattern-fg) bg-[image:repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-[length:10px_10px]"
    aria-hidden
  >
    {infoMode === 'dev' && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center font-mono text-[10px] text-ink/40">
        <span>{index}) </span>
        <span>{formatSpanProps(spanProps)}</span>
        <span className="text-ink/25">{formatCaps(caps)}</span>
      </div>
    )}
  </div>
);
