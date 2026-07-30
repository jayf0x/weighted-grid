import { useEffect, useState } from "react";
import { BackgroundHatch } from "@/components/BackgroundHatch";

export function Backdrop() {
  const [isLive, setLive] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let frame = 0;
    let live = false;
    let x = 0;
    let y = 0;

    const write = () => {
      frame = 0;
      root.style.setProperty("--cx", `${x}px`);
      root.style.setProperty("--cy", `${y}px`);
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

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* The margins either side of the content column. Both collapse to zero width below 80rem,
          which is exactly when there is no margin left to hatch. */}
      <BackgroundHatch className="absolute inset-y-0 left-0 border-r border-rule w-10" />
      <BackgroundHatch className="absolute inset-y-0 right-0 border-l border-rule w-20 opacity-15" />

      {/* the paper falls off at the edges so the content column reads as lit */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(150% 120% at 50% 15%, transparent 0%, transparent 50%, color-mix(in oklab, var(--paper) 92%, black) 100%)",
        }}
      />

      {/* CAD crosshair — invisible until a fine pointer has actually moved */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isLive ? 0.5 : 0 }}
      >
        <div
          className="absolute top-0 h-full w-px bg-accent/20"
          style={{ left: "var(--cx, -100px)" }}
        />
        <div
          className="absolute left-0 h-px w-full bg-accent/20"
          style={{ top: "var(--cy, -100px)" }}
        />
      </div>
    </div>
  );
}
