import { clsx } from 'clsx';
import type { ComponentProps, ReactNode } from 'react';

/** Negative space that reads as *deliberately* nothing: a faint 315° hatch between hairline side
 * rules. The alternative — an empty box — reads as a bug in a layout demo, which is exactly the
 * wrong signal on a page about how gaps get filled. */
export const Hatch = ({ className, ...props }: ComponentProps<'div'>) => (
  <div aria-hidden className={clsx('hatch h-full w-full border-x border-rule', className)} {...props} />
);

/** Crop marks. Four corner ticks that frame a stage the way a drafting case frames a drawing —
 * cheaper and quieter than a full border, and it survives content bleeding to the edge. */
export const CropMarks = ({ className }: { className?: string }) => (
  <div aria-hidden className={clsx('pointer-events-none absolute inset-0 z-10', className)}>
    {(
      [
        'top-0 left-0 border-t border-l',
        'top-0 right-0 border-t border-r',
        'bottom-0 left-0 border-b border-l',
        'bottom-0 right-0 border-b border-r',
      ] as const
    ).map((pos) => (
      <span key={pos} className={clsx('absolute size-2.5 border-ink-3/70', pos)} />
    ))}
  </div>
);

/** The mono caption that labels a measured thing. */
export const Spec = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={clsx('spec', className)}>{children}</span>
);

/** A prop name, rendered as code. Each case lists the API surface it's actually about. */
export const PropChip = ({ children }: { children: ReactNode }) => (
  <code className="border border-rule bg-tint px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{children}</code>
);

/** "CASE 03/05" — the page is a set of numbered cases, and the number is how you refer to one
 * out loud, in a review or in a prompt. */
export const CaseBadge = ({ index, total }: { index: number; total: number }) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="spec text-accent">
      case {pad(index)}
      <span className="text-ink-3">/{pad(total)}</span>
    </span>
  );
};
