import type { PlateInfo } from '@/typing';
import { PlateBadge } from '@/components/PlateBadge';

/** The header row every non-static (`kind: 'component'`) example renders — same title/plate
 * layout `Title` gives static examples, since those don't come with a `Grid`-props line to show. */
export const ComponentHeader = ({ title, plate }: { title: string; plate: PlateInfo }) => (
  <div className="flex items-baseline justify-between gap-3">
    <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">{title}</h2>
    <PlateBadge {...plate} />
  </div>
);
