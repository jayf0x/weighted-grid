/** Two hairline sidelines bounding the content column, ticked every 48px — a technical-drawing
 * margin, always full page height. Purely decorative (`aria-hidden`), fixed so it doesn't scroll
 * with content and never affects layout (`pointer-events-none`). Render once, high in the tree. */
export function Blueprint() {
  const tickLine =
    'fixed inset-y-0 z-0 hidden w-2 bg-[image:repeating-linear-gradient(to_bottom,var(--color-line)_0,var(--color-line)_1px,transparent_1px,transparent_48px)] bg-[length:8px_48px] bg-repeat-y opacity-70 md:block';

  return (
    <div aria-hidden className="pointer-events-none">
      <div className={`${tickLine} left-[max(1rem,calc(50%-40rem))] border-l border-line`} />
      <div className={`${tickLine} right-[max(1rem,calc(50%-40rem))] border-r border-line`} />
    </div>
  );
}
