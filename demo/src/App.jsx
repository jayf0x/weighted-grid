import { useMemo, useState } from 'react';
import { Controls } from './components/Controls.jsx';
import { DemoPanel } from './components/DemoPanel.jsx';
import { Header } from './components/Header.jsx';
import { PinnedExample } from './components/PinnedExample.jsx';
import { buildBlocks } from './utils/blocks.js';

export function App() {
  const [count, setCount] = useState(20);
  const [nrCols, setNrCols] = useState(7);
  const [weights, setWeights] = useState({ A: 3, B: 5, C: 2 });
  const setWeight = (label, value) => setWeights((w) => ({ ...w, [label]: value }));

  const [gap, setGap] = useState(6);
  const [stretch, setStretch] = useState(Number.POSITIVE_INFINITY);
  const [showGrid, setShowGrid] = useState(false);
  const [fillGaps, setFillGaps] = useState(false);

  const blocks = useMemo(() => buildBlocks(count, weights), [count, weights]);

  return (
    <div className="min-h-screen bg-page">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-8 pb-16">
        <Controls
          count={count}
          setCount={setCount}
          nrCols={nrCols}
          setNrCols={setNrCols}
          weights={weights}
          setWeight={setWeight}
          gap={gap}
          setGap={setGap}
          stretch={stretch}
          setStretch={setStretch}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          fillGaps={fillGaps}
          setFillGaps={setFillGaps}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DemoPanel
            title='rowHeight="auto" — stretches to fill'
            caption="Rows split the container's height. Drag the bottom-right corner; it reflows with zero re-pack."
            blocks={blocks}
            nrCols={nrCols}
            rowHeight="auto"
            gap={gap}
            stretch={stretch}
            showGrid={showGrid}
            fillGaps={fillGaps}
          />
          <DemoPanel
            title="rowHeight={72} — flows down"
            caption="Same placement, but each row is a fixed 72px and the grid grows downward instead."
            blocks={blocks}
            nrCols={nrCols}
            rowHeight={72}
            gap={gap}
            stretch={stretch}
            showGrid={showGrid}
            fillGaps={fillGaps}
          />
        </div>

        <PinnedExample />
      </main>

      <footer className="px-8 pb-10 text-center text-[12px] text-ink/30">MIT · @weighted-grid/react</footer>
    </div>
  );
}
