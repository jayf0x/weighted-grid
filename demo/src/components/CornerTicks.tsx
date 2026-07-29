const CORNERS = [
  'top-0 left-0 border-t border-l',
  'top-0 right-0 border-t border-r',
  'bottom-0 left-0 border-b border-l',
  'bottom-0 right-0 border-b border-r',
];

/** Four L-shaped crop marks at the corners of a `relative` ancestor — the "spec sheet plate"
 * framing device. Decorative only; drop into any `<div className="relative">` wrapping a bordered
 * example box. */
export function CornerTicks() {
  return (
    <>
      {CORNERS.map((corner) => (
        <span key={corner} className={`pointer-events-none absolute z-10 h-3 w-3 border-accent/50 ${corner}`} />
      ))}
    </>
  );
}
