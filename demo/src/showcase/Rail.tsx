import { useEffect, useState } from 'react';
import type { PlateRegistry } from './types';

/** Which plate is currently under the reading line.
 *
 * An IntersectionObserver with a band near the top of the viewport, rather than "most visible":
 * a tall stage and a short one shouldn't compete on area, and the thing you're reading is the
 * thing whose title just passed the top. */
export function useActivePlate(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const hit = ids.find((id) => seen.get(id));
        if (hit) setActive(hit);
      },
      { rootMargin: '-12% 0px -78% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [ids]);

  return active;
}

/** The margin ruler: one tick per plate, the current one extended and inked. Wide screens only —
 * below that the plate numbers in each caption already do the job. */
export function Rail({ plates, active }: { plates: PlateRegistry; active: string }) {
  return (
    <nav aria-label="Plates" className="pointer-events-none fixed top-1/2 left-6 z-30 hidden -translate-y-1/2 xl:block">
      <ul className="flex flex-col gap-3">
        {plates.map((p, i) => {
          const isActive = p.id === active;
          return (
            <li key={p.id} className="pointer-events-auto">
              <a href={`#${p.id}`} className="group flex items-center gap-3" title={p.title}>
                <span
                  className={
                    'h-px transition-all duration-500 ease-plate ' +
                    (isActive ? 'w-8 bg-accent' : 'w-4 bg-ink-3/60 group-hover:w-6 group-hover:bg-ink-2')
                  }
                />
                {/* label on hover only — the active plate is already named in its own caption, and
                    a permanent one would collide with the content column on a 1280px viewport */}
                <span
                  className={
                    'font-mono text-[10px] whitespace-nowrap tracking-[0.1em] opacity-0 transition-opacity duration-300 group-hover:opacity-100 ' +
                    (isActive ? 'text-accent' : 'text-ink-3')
                  }
                >
                  {String(i + 1).padStart(2, '0')} · {p.title.toLowerCase()}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
