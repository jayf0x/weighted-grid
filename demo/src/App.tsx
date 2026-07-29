import { useState } from 'react';
import { Blueprint } from '@/components/Blueprint';
import { ControlRail } from '@/components/ControlRail';
import { ExampleSection } from '@/components/ExampleSection';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { examples } from '@/examples';
import type { InfoMode } from '@/typing';
import { ControlsRailProvider } from '@/utils/controlsRail';

/** Storybook-scroll shell: stacks every example vertically, in the order `src/examples/index.ts`
 * declares, beside one sticky `<ControlRail>` that swaps content to whichever example is in view
 * (`ControlsRailProvider`/`useSectionControls`, see `utils/controlsRail.tsx`). Owns the single
 * global simple/dev info toggle (`infoMode`) — "how much QA detail am I looking at right now", one
 * axis for the whole page, not a per-example setting. */
export function App() {
  const [infoMode, setInfoMode] = useState<InfoMode>('simple');

  return (
    <div className="relative min-h-screen bg-page">
      <Blueprint />
      <Header infoMode={infoMode} setInfoMode={setInfoMode} />
      <Hero />

      <ControlsRailProvider>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-8 pb-16 lg:flex-row lg:gap-8">
          <main className="order-2 flex min-w-0 flex-1 flex-col gap-20 lg:order-1">
            {examples.map((entry, i) => {
              const plate = { index: i + 1, total: examples.length };
              return entry.kind === 'data' ? (
                <ExampleSection key={i} example={entry.example} infoMode={infoMode} plate={plate} />
              ) : (
                <entry.Component key={i} infoMode={infoMode} plate={plate} />
              );
            })}
          </main>
          <ControlRail />
        </div>
      </ControlsRailProvider>

      <footer className="px-8 pb-10 text-center text-[12px] text-ink/30">MIT · @weighted-grid/react</footer>
    </div>
  );
}
