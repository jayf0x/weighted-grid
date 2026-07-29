import type { Plate } from '@/showcase/types';

/* Every plate lives in `src/showcases/<id>/plate.tsx` and exports one `plate`. Both the module and
 * its own source text are globbed here, so adding a plate is: write the file, add its id to ORDER.
 * The raw glob is what makes "here is the source" free — no per-plate `?raw` import to forget. */
const modules = import.meta.glob('./*/plate.tsx', { eager: true }) as Record<string, { plate: Plate }>;
const sources = import.meta.glob('./*/plate.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** Reading order. Explicit rather than alphabetical: the page opens on the single idea the library
 * is built around and only then earns the right to talk about edge cases. */
const ORDER = ['weight', 'pinning', 'stretch', 'presets', 'responsive', 'row-height'] as const;

const byId = new Map(Object.entries(modules).map(([path, m]) => [m.plate.id, { plate: m.plate, path }]));

export const plates: Plate[] = ORDER.map((id) => {
  const found = byId.get(id);
  if (!found) throw new Error(`No plate exports id "${id}" — check src/showcases/${id}/plate.tsx`);
  return found.plate;
});

export const sourceOf = (id: string): string | undefined => {
  const found = byId.get(id);
  return found ? sources[found.path] : undefined;
};
