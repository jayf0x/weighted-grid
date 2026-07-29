import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { useWidth } from '@/showcase/hooks';
import { CropMarks } from '@/showcase/primitives';
import { seededWeight } from './seed';
import { Tile } from './tiles';

// enough tiles that 8 columns resolve to roughly square cells in the stage's aspect
const COUNT = 44;
const CYCLE_MS = 2600;

/** The specimen: the library laying out its own hero.
 *
 * One tile is re-weighted every few seconds and the rest re-flow around it — the argument for the
 * whole package, made before a word of it is read. Paused for reduced-motion and whenever the tab
 * is hidden, because an offscreen `setInterval` re-rendering a grid is just heat. */
function Specimen() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  // a 40px cell is not a mosaic, it's noise — fewer columns on a phone
  const nrCols = width && width < 480 ? 5 : 8;
  const [weights, setWeights] = useState<number[]>(() => Array.from({ length: COUNT }, (_, i) => seededWeight(i)));

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    const tick = () => {
      if (!document.hidden) {
        setWeights((prev) => {
          const next = [...prev];
          const i = Math.floor(Math.random() * COUNT);
          next[i] = (next[i] % 3) + 1;
          return next;
        });
      }
      timer = window.setTimeout(tick, CYCLE_MS);
    };
    timer = window.setTimeout(tick, CYCLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={ref} className="relative h-full w-full">
      <CropMarks />
      <Grid nrCols={nrCols} gap={5} animateSize animatePosition>
        {weights.map((w, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
          <GridItem key={i} weight={w}>
            <Tile n={w - 1} accent={w === 3} />
          </GridItem>
        ))}
      </Grid>
    </div>
  );
}

const INSTALL = 'bun add weighted-grid';

function Install() {
  const [isCopied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(INSTALL).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className="group flex w-full max-w-[22rem] cursor-pointer items-center justify-between border border-rule bg-raised px-3 py-2.5 text-left transition-colors duration-200 hover:border-rule-strong"
    >
      <code className="font-mono text-[13px] text-ink">
        <span className="text-ink-3 select-none">$ </span>
        {INSTALL}
      </code>
      <span className="spec text-accent">{isCopied ? 'copied' : 'copy'}</span>
    </button>
  );
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero({ version }: { version: string }) {
  return (
    <header className="grid items-center gap-10 py-16 lg:min-h-[78vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:py-24">
      <div>
        <motion.p {...stagger(0)} className="spec">
          weighted-grid <span className="text-ink-3">·</span> v{version}
        </motion.p>

        <motion.h1
          {...stagger(1)}
          className="mt-6 font-display text-[clamp(2.75rem,7vw,5.25rem)] leading-[0.94] tracking-[-0.02em] text-balance"
        >
          A grid that
          <br />
          works out
          <span className="text-accent"> the rest</span>.
        </motion.h1>

        <motion.p {...stagger(2)} className="mt-7 max-w-[46ch] text-[15px] leading-relaxed text-ink-2 text-pretty">
          Give each child a weight — how much of the grid it gets — and the placement engine sizes both axes, fills the
          gaps, and keeps your source order. Native CSS Grid underneath; the JavaScript only decides where things go.
        </motion.p>

        <motion.div {...stagger(3)} className="mt-9 flex flex-col gap-4">
          <Install />
          <div className="flex items-center gap-5">
            <a
              href="#weight"
              className="spec border-b border-accent pb-0.5 text-accent transition-opacity hover:opacity-70"
            >
              start at plate 01 ↓
            </a>
            <a
              href="https://github.com/jayf0x/weighted-grid"
              className="spec transition-colors hover:text-ink"
              target="_blank"
              rel="noreferrer"
            >
              github ↗
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="h-[min(58vh,32rem)]"
      >
        <Specimen />
      </motion.div>
    </header>
  );
}
