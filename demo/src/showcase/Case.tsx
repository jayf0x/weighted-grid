import { motion } from 'motion/react';
import { createContext, type ReactNode, useContext } from 'react';
import { BackgroundHatch } from '@/components/BackgroundHatch';
import { CaseBadge, CropMarks, PropChip } from './primitives';
import { Source } from './Source';
import type { Case as CaseDef, CaseIndex } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
   The case frame — the one piece of chrome every showcase gets.

   Left: the stage, cropped by corner marks, holding whatever the case renders.
   Right: the caption block — number, title, lede, the props it's about, the
   case's own controls, and its source. Sticky on wide screens so the knobs stay
   reachable while a tall stage scrolls past; stacked on narrow ones.

   A case component owns its state and renders `<CaseFrame>`; the *identity*
   (title, number, source) arrives through context from the page, so a case
   never has to be handed props it doesn't care about, and the page never has to
   reach into a case to render its controls somewhere else. That split is what
   makes this layer liftable into another repo unchanged.
   ───────────────────────────────────────────────────────────────────────────── */

type CaseCtx = { def: CaseDef; at: CaseIndex; source?: string };

const Ctx = createContext<CaseCtx | null>(null);

export const CaseProvider = ({ value, children }: { value: CaseCtx; children: ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

/* The stage is a *fixed* box, and its content is clipped.
 *
 * Every case has controls that change how much grid there is — more tiles, fewer columns, a taller
 * preset — and with an auto-height stage each of those re-flowed the entire page under the reader's
 * cursor: scroll position jumped, the sticky caption slid, the next case moved. Clipping is the
 * cheaper trade by a mile. Nobody needs to see the 40th tile; everybody notices the page moving. */
const HEIGHTS = {
  stage: 'h-[min(62vh,34rem)]',
  tall: 'h-[min(78vh,44rem)]',
} as const;

export type CaseFrameProps = {
  /** The live thing. */
  children: ReactNode;
  /** Whatever `useControls` returned as `panel`, or any custom node. */
  controls?: ReactNode;
  /** Stage height. `tall` for grids that need the extra room. Never content-sized — see above. */
  height?: keyof typeof HEIGHTS;
};

export function CaseFrame({ children, controls, height = 'stage' }: CaseFrameProps) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('<CaseFrame> must render inside a <CaseProvider>');
  const { def, at, source } = ctx;

  return (
    <motion.section
      id={def.id}
      data-case={def.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="line-t scroll-mt-24 py-12 lg:py-20"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_19rem] lg:gap-12">
        {/* min-w-0: without it a wide stage refuses to shrink below its content and pushes the
            whole grid past the viewport */}
        <div className="order-2 min-w-0 lg:order-1">
          <div className={`relative overflow-hidden ${HEIGHTS[height]}`}>
            <CropMarks />
            <div className="h-full w-full">{children}</div>
            {/* A hard cut mid-tile reads as a rendering bug; a short fade reads as a window onto
                something larger. Invisible when the grid is shorter than the stage — it fades to
                the page colour over the page colour. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-paper"
            />
          </div>
        </div>

        <aside className="order-1 min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <BackgroundHatch
              className="w-4 absolute h-full right-0 translate-x-10"
              style={{ backgroundAttachment: 'local' }}
            />

            <BackgroundHatch
              className="h-4 absolute w-full bottom-0 translate-5"
              style={{ backgroundAttachment: 'local' }}
            />

            <CaseBadge index={at.index} total={at.total} />

            <h2 className="headline mt-3 text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.02] text-balance">{def.title}</h2>

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
