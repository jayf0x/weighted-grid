import type { PlateInfo } from '@/typing';

/** "PLATE 0N/0M" — the drafting-sheet numbering every example carries next to its title. */
export const PlateBadge = ({ index, total }: PlateInfo) => (
  <span className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-ink/25">
    PLATE {String(index).padStart(2, '0')}/{String(total).padStart(2, '0')}
  </span>
);
