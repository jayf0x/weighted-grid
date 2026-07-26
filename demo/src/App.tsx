import { useState } from 'react';
import { ExampleSection } from '@/components/ExampleSection';
import { Header } from '@/components/Header';
import { examples } from '@/examples';
import type { InfoMode } from '@/typing';

/** Storybook-scroll shell: stacks every example vertically, in the order `src/examples/index.ts`
 * declares. Owns the single global simple/dev info toggle (`infoMode`) — "how much QA detail am I
 * looking at right now", one axis for the whole page, not a per-example setting. */
export function App() {
  const [infoMode, setInfoMode] = useState<InfoMode>('simple');

  return (
    <div className="min-h-screen bg-page">
      <Header infoMode={infoMode} setInfoMode={setInfoMode} />

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-8 pb-16">
        {examples.map((entry, i) =>
          entry.kind === 'data' ? (
            <ExampleSection key={i} example={entry.example} infoMode={infoMode} />
          ) : (
            <entry.Component key={i} infoMode={infoMode} />
          ),
        )}
      </main>

      <footer className="px-8 pb-10 text-center text-[12px] text-ink/30">MIT · @weighted-grid/react</footer>
    </div>
  );
}
