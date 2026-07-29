import { ArrowDown, Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Grid, GridItem } from 'weighted-grid/react';
import { useWidth } from '@/showcase/hooks';
import { CropMarks } from '@/showcase/primitives';
import { seededWeight } from './seed';
import { Tile } from './tiles';

const COUNT = 40;
const CYCLE_MS = 2600;

const photo = (n: number) => `${import.meta.env.BASE_URL}organic/img-${n}.jpg`;

/** What actually sits in the specimen. Most cells stay blank on purpose — the grid is the subject,
 * and a wall of photographs would make this a mood board. A handful of real images and three runs
 * of text are enough to show the tiles hold arbitrary content and reflow with it. */
const CONTENT: Record<number, { photo: number } | { text: string }> = {
  1: { photo: 3 },
  4: { text: 'Any child, any content. The engine only decides how much room it gets.' },
  7: { photo: 0 },
  12: { photo: 6 },
  17: { text: 'Source order is preserved, always.' },
  21: { photo: 8 },
  28: { photo: 2 },
  33: { text: 'Native CSS Grid underneath.' },
};

/** Indices the cycler is allowed to touch — everything that isn't holding content. */
const FREE = Array.from({ length: COUNT }, (_, i) => i).filter((i) => !(i in CONTENT));

/** The specimen: the library laying out its own hero. One tile is re-weighted every few seconds and
 * everything else re-flows around it — the argument for the whole package, made before a word of it
 * is read. Paused for reduced motion and for hidden tabs. */
function Specimen() {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  // `rowHeight="auto"` divides the stage height by the row count, so tile *count* is what keeps
  // cells square here: too many tiles on a narrow stage and every row becomes a 40px letterbox
  // that clips its own content. Fewer columns and fewer tiles on a phone.
  const isNarrow = Boolean(width) && width < 480;
  const nrCols = isNarrow ? 5 : 8;
  const count = isNarrow ? 16 : COUNT;
  // content tiles never drop to 1×1 — a postage-stamp photo and a clipped sentence are worse than
  // no content at all, so they start bigger and the cycler leaves them alone
  const [weights, setWeights] = useState<number[]>(() =>
    Array.from({ length: COUNT }, (_, i) => (i in CONTENT ? Math.max(2, seededWeight(i)) : seededWeight(i))),
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    const tick = () => {
      if (!document.hidden) {
        setWeights((prev) => {
          const next = [...prev];
          const i = FREE[Math.floor(Math.random() * FREE.length)];
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
        {weights.slice(0, count).map((w, i) => {
          const content = CONTENT[i];
          return (
            // content tiles opt out of `stretch`: a tile grown into a long thin strip clips its own
            // text, and a square is what a photo wants anyway.
            // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
            <GridItem key={i} weight={w} stretch={content ? 0 : undefined}>
              {content && 'photo' in content ? (
                <div className="h-full w-full overflow-hidden border border-rule bg-sunk">
                  <img
                    src={photo(content.photo)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover contrast-[1.05] saturate-[0.5]"
                  />
                </div>
              ) : content ? (
                <div className="flex h-full w-full items-end overflow-hidden border border-rule bg-raised p-2.5">
                  <p className="line-clamp-4 text-[11px] leading-snug text-ink-2">{content.text}</p>
                </div>
              ) : (
                <Tile n={w - 1} />
              )}
            </GridItem>
          );
        })}
      </Grid>
    </div>
  );
}

const INSTALL = { bun: 'bun add weighted-grid', npm: 'npm i weighted-grid' } as const;
type Manager = keyof typeof INSTALL;

function Install() {
  const [manager, setManager] = useState<Manager>('bun');
  const [isCopied, setCopied] = useState(false);
  const command = INSTALL[manager];

  return (
    <div className="w-full max-w-[24rem] border border-rule bg-raised">
      <div className="flex border-b border-rule">
        {(Object.keys(INSTALL) as Manager[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setManager(m)}
            aria-pressed={manager === m}
            className={
              'spec cursor-pointer px-3 py-2 transition-colors duration-150 ' +
              (manager === m ? 'border-b border-accent text-accent' : 'hover:text-ink-2')
            }
          >
            {m}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          });
        }}
        className="group flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <code className="truncate font-mono text-[13px] text-ink">
          <span className="text-ink-3 select-none">$ </span>
          {command}
        </code>
        <span className="shrink-0 text-ink-3 transition-colors group-hover:text-accent">
          {isCopied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
          <span className="sr-only">Copy install command</span>
        </span>
      </button>
    </div>
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
      <div className="min-w-0">
        <motion.p {...stagger(0)} className="spec">
          weighted-grid <span className="text-ink-3">·</span> v{version}
        </motion.p>

        <motion.h1
          {...stagger(1)}
          className="headline mt-6 text-[clamp(3rem,7.5vw,5.75rem)] leading-[0.92] text-balance"
        >
          A grid that
          <br />
          works out
          <span className="text-accent"> the rest</span>.
        </motion.h1>

        <motion.p {...stagger(2)} className="mt-7 max-w-[46ch] text-[15px] leading-relaxed text-ink-2 text-pretty">
          Give each child a weight — how much of the grid it gets — and the placement engine sizes both axes, fills the
          gaps, and keeps your source order.
        </motion.p>

        <motion.div {...stagger(3)} className="mt-9 flex flex-col gap-4">
          <Install />
          <a
            href="#weight"
            className="spec inline-flex w-fit items-center gap-1.5 border-b border-accent pb-1 text-accent transition-opacity hover:opacity-70"
          >
            start at case 01 <ArrowDown className="size-3" />
          </a>
        </motion.div>
      </div>

      <motion.div
        // opacity only, deliberately: this wrapper contains a self-measuring grid, and a `scale`
        // here rescales every FLIP measurement taken while it eases — tiles glitch into place for
        // reasons that have nothing to do with layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.25 }}
        className="h-[min(58vh,32rem)] min-w-0"
      >
        <Specimen />
      </motion.div>
    </header>
  );
}
