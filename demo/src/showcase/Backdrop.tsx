import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   The drafting table.

   Two layers, both cheap: a millimetre dot lattice, and a CAD crosshair that
   tracks the pointer. The crosshair is the signature — it turns the whole page
   into one instrument surface instead of a document with a cursor on it, and it
   costs two CSS custom properties written once per animation frame. No canvas,
   no WebGL, nothing to tear down.

   Fine pointers only: on touch there is no hover position to report, and a
   crosshair pinned wherever you last tapped is noise.
   ───────────────────────────────────────────────────────────────────────────── */

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
      {/* dot lattice */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--rule) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* the paper falls off at the edges so the content column reads as lit */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(150% 120% at 50% 15%, transparent 0%, transparent 50%, color-mix(in oklab, var(--paper) 94%, black) 100%)',
        }}
      />
      {/* CAD crosshair — invisible until a fine pointer has actually moved */}
      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: isLive ? 1 : 0 }}>
        <div className="absolute top-0 h-full w-px bg-accent/25" style={{ left: 'var(--cx, -100px)' }} />
        <div className="absolute left-0 h-px w-full bg-accent/25" style={{ top: 'var(--cy, -100px)' }} />
      </div>
    </div>
  );
}
