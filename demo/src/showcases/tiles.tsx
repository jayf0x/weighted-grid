import { clsx } from 'clsx';
import type { ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Specimen tiles — the repo-specific half of the page.

   Monochrome on purpose: this grid is about *shape*, and a rainbow of tiles
   makes every layout look busy and identical. Depth comes from four ink tints
   stepped by index; the one accent tile per grid gives the eye an anchor to
   track while a layout reflows.
   ───────────────────────────────────────────────────────────────────────────── */

const TINTS = [
  'bg-[color-mix(in_oklab,var(--ink)_5%,var(--paper))]',
  'bg-[color-mix(in_oklab,var(--ink)_9%,var(--paper))]',
  'bg-[color-mix(in_oklab,var(--ink)_14%,var(--paper))]',
  'bg-[color-mix(in_oklab,var(--ink)_20%,var(--paper))]',
];

export type TileProps = {
  /** Drives the tint step and the default label. */
  n?: number;
  /** Mono caption in the corner — the tile's own spec, e.g. `weight 2` or `3×2`. */
  label?: string;
  accent?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Tile({ n = 0, label, accent, children, className, onClick }: TileProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'group relative flex h-full w-full items-end overflow-hidden border p-2 text-left transition-colors duration-300',
        accent ? 'border-accent/50 bg-accent-soft' : `border-rule ${TINTS[n % TINTS.length]}`,
        onClick && 'cursor-pointer hover:border-accent',
        className,
      )}
    >
      {children}
      {label && (
        <span
          className={clsx(
            'spec relative z-10 transition-colors duration-300',
            accent ? 'text-accent' : 'group-hover:text-ink-2',
          )}
        >
          {label}
        </span>
      )}
    </Tag>
  );
}

/** Intentional negative space. Hatched, so it reads as "nothing goes here", not "the layout broke". */
export const Void = ({ label }: { label?: string }) => (
  <div className="hatch relative flex h-full w-full items-end border-x border-rule p-2">
    {label && <span className="spec">{label}</span>}
  </div>
);

/** What `fillComponent` renders into whatever `stretch` couldn't reach. Dashed, to distinguish a
 * plugged remainder from a tile that was placed there on purpose. */
export const Filler = ({ label }: { label?: string }) => (
  <div className="flex h-full w-full items-center justify-center border border-dashed border-accent/40 bg-accent-soft/40">
    {label && <span className="spec text-accent/80">{label}</span>}
  </div>
);
