import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   The drafting table.

   Three layers, all cheap:

   1. Two hatched margins flanking the content column, ruled on their inner
      edge. This is the Tailwind-site trick — a 315° repeating-linear-gradient
      between hairlines — and it does the architectural work a dot lattice was
      doing badly: it marks *where the column is* instead of texturing the whole
      page, so it stays legible at full strength and never competes with a grid
      of tiles for attention. `bg-fixed` keeps the hatch stationary while the
      page scrolls, so the margins read as the sheet rather than as content.
   2. A vignette, so the column reads as lit.
   3. A CAD crosshair tracking the pointer. Two CSS custom properties written
      once per animation frame — no canvas, nothing to tear down.

   The crosshair is fine-pointer only: on touch there is no hover position to
   report, and a crosshair pinned wherever you last tapped is noise.
   ───────────────────────────────────────────────────────────────────────────── */

// 40rem is half of the 80rem content column in `App.tsx`: the margins are defined as "everything
// outside the column", so they can't drift out of alignment with it.
const HATCH = 'repeating-linear-gradient(315deg, var(--hatch) 0, var(--hatch) 1px, transparent 0, transparent 50%)';

export function Backdrop() {
  const [isLive, setLive] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    let frame = 0;
    let live = false;
    let x = 0;
    let y = 0;

    const write = () => {
      frame = 0;
      root.style.setProperty('--cx', `${x}px`);
      root.style.setProperty('--cy', `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      // one write per frame — pointermove fires far more often than the compositor paints
      if (!frame) frame = requestAnimationFrame(write);
      if (!live) {
        live = true;
        setLive(true);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* hatched margins — only rendered once the viewport is wide enough to have margins */}
      <div
        className="absolute inset-y-0 right-[calc(50%+40rem)] left-0 hidden border-r border-rule md:block"
        style={{ backgroundImage: HATCH, backgroundSize: '10px 10px', backgroundAttachment: 'fixed' }}
      />
      <div
        className="absolute inset-y-0 right-0 left-[calc(50%+40rem)] hidden border-l border-rule md:block"
        style={{ backgroundImage: HATCH, backgroundSize: '10px 10px', backgroundAttachment: 'fixed' }}
      />

      {/* the paper falls off at the edges so the content column reads as lit */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(150% 120% at 50% 15%, transparent 0%, transparent 50%, color-mix(in oklab, var(--paper) 92%, black) 100%)',
        }}
      />

      {/* CAD crosshair — invisible until a fine pointer has actually moved */}
      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: isLive ? 1 : 0 }}>
        <div className="absolute top-0 h-full w-px bg-accent/20" style={{ left: 'var(--cx, -100px)' }} />
        <div className="absolute left-0 h-px w-full bg-accent/20" style={{ top: 'var(--cy, -100px)' }} />
      </div>
    </div>
  );
}
