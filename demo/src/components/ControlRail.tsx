import { useActiveRailContent } from '@/utils/controlsRail';

/** The one control surface for every example. Desktop: sticky column beside the content. Mobile:
 * a bar docked under the header, full width. Content is whatever the in-view example registered
 * via `useSectionControls` — this component has no per-example knowledge at all. */
export function ControlRail() {
  const { activeId, activeNode } = useActiveRailContent();

  return (
    <aside className="sticky top-16 z-20 order-1 w-full shrink-0 lg:top-20 lg:order-2 lg:w-72">
      <div className="rounded-lg border border-line bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
            live controls
          </span>
        </div>
        <div key={activeId} className="panel-in flex flex-col gap-4 p-4">
          {activeNode ?? (
            <p className="text-[13px] leading-relaxed text-ink/35">Scroll to an example — its controls show up here.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
