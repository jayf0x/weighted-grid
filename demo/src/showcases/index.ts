import type { Case } from '@/showcase/types';

/* Every case lives in `src/showcases/<id>/case.tsx` and exports one `showcase`. Both the module and
 * its own source text are globbed here, so adding a case is: write the file, add its id to ORDER.
 * The raw glob is what makes "here is the source" free — no per-case `?raw` import to forget. */
const modules = import.meta.glob('./*/case.tsx', { eager: true }) as Record<string, { showcase: Case }>;
const sources = import.meta.glob('./*/case.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** Reading order. Explicit rather than alphabetical: the page opens on the single idea the library
 * is built around and only then earns the right to talk about edge cases. */
const ORDER = ['weight', 'pinning', 'stretch', 'presets', 'animation', 'responsive'] as const;

const byId = new Map(Object.values(modules).map((m) => [m.showcase.id, m.showcase]));
const pathById = new Map(Object.entries(modules).map(([path, m]) => [m.showcase.id, path]));

export const cases: Case[] = ORDER.map((id) => {
  const found = byId.get(id);
  if (!found) throw new Error(`No case exports id "${id}" — check src/showcases/${id}/case.tsx`);
  return found;
});

export const sourceOf = (id: string): string | undefined => {
  const path = pathById.get(id);
  return path ? sources[path] : undefined;
};
