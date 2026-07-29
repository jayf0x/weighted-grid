import type { ExampleMeta, PlateInfo } from '@/typing';
import { PlateBadge } from '@/components/PlateBadge';

/** Example header: name + tile count + the exact `Grid` props in effect, so the setup is readable
 * without opening the example's source. Ported from dev's `Title.tsx`, restyled onto demo's theme
 * (matches the uppercase/tracked headings the rest of the demo already uses). */
export const Title = ({
  title,
  meta,
  tileCount,
  plate,
}: {
  title: string;
  meta: ExampleMeta;
  tileCount: number;
  plate: PlateInfo;
}) => (
  <div className="flex items-baseline justify-between gap-3">
    <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">
      {title}{' '}
      <span className="font-mono text-[11px] normal-case tracking-normal text-ink/30">
        ({tileCount} tiles,{' '}
        {Object.entries(meta)
          .map(([k, v]) => `${k}=${v}`)
          .join(' ')}
        )
      </span>
    </h2>
    <PlateBadge {...plate} />
  </div>
);
