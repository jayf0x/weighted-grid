import { motion } from 'motion/react';
import { createContext, type ReactNode, useContext } from 'react';
import { CropMarks, PlateBadge, PropChip } from './primitives';
import { Source } from './Source';
import type { Plate as PlateDef, PlateIndex } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   The plate frame — the one piece of chrome every showcase gets.

   Left: the stage, cropped by corner marks, holding whatever the plate renders.
   Right: the caption block — number, title, lede, the props it's about, the
   plate's own controls, and its source. Sticky on wide screens so the knobs
   stay reachable while a tall stage scrolls past; stacked on narrow ones.

   A plate component owns its state and renders `<PlateFrame>`; the *identity*
   (title, number, source) arrives through context from the page, so a plate
   never has to be handed props it doesn't care about, and the page never has to
   reach into a plate to render its controls somewhere else. That split is what
   makes this layer liftable into another repo unchanged.
   ───────────────────────────────────────────────────────────────────────────── */

type PlateCtx = { def: PlateDef; at: PlateIndex; source?: string };

const Ctx = createContext<PlateCtx | null>(null);

export const PlateProvider = ({ value, children }: { value: PlateCtx; children: ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

const HEIGHTS = {
  stage: 'h-[min(62vh,34rem)]',
  tall: 'h-[min(82vh,46rem)]',
  auto: '',
} as const;

export type PlateFrameProps = {
  /** The live thing. */
  children: ReactNode;
  /** Whatever `useControls` returned as `panel`, or any custom node. */
  controls?: ReactNode;
  /** Stage height. `tall` for grids that need room, `auto` for content-sized ones. */
  height?: keyof typeof HEIGHTS;
};

export function PlateFrame({ children, controls, height = 'stage' }: PlateFrameProps) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('<PlateFrame> must render inside a <PlateProvider>');
  const { def, at, source } = ctx;

  return (
    <motion.section
      id={def.id}
      data-plate={def.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="line-t scroll-mt-24 py-12 lg:py-20"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_19rem] lg:gap-12">
        <div className="order-2 lg:order-1">
          <div className={`relative ${HEIGHTS[height]}`}>
            <CropMarks />
            <div className="h-full w-full">{children}</div>
          </div>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <PlateBadge index={at.index} total={at.total} />

            <h2 className="mt-3 font-display text-[clamp(1.75rem,3vw,2.4rem)] leading-[1.05] tracking-[-0.01em] text-balance">
              {def.title}
            </h2>

            <p className="mt-3 max-w-[38ch] text-[14px] leading-relaxed text-ink-2 text-pretty">{def.lede}</p>

            {def.props && def.props.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {def.props.map((p) => (
                  <PropChip key={p}>{p}</PropChip>
                ))}
              </div>
            )}

            {controls && <div className="mt-7">{controls}</div>}

            {source && (
              <div className="mt-6">
                <Source code={source} id={def.id} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </motion.section>
  );
}
