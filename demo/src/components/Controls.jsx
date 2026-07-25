import { Slider } from './Slider.jsx';

const STRETCH_MAX = 12; // slider caps at 12; treat the top notch as "unlimited" (Grid's own default)

/** Labeled checkbox used by the control bar's boolean toggles. */
const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-[13px] text-ink/60">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
    {label}
  </label>
);

/** The single control bar driving both demo panels below it. Three labeled blocks (A/B/C, spread
 * across the list) each get their own weight slider — makes it easy to see that changing one
 * item's weight resizes it in place instead of reshuffling everything around it. Gap/stretch/
 * showGrid/fillGaps map directly onto `<Grid>`'s own props, so this doubles as a live prop
 * showcase, not just a weight demo. */
export function Controls({
  count,
  setCount,
  nrCols,
  setNrCols,
  weights,
  setWeight,
  gap,
  setGap,
  stretch,
  setStretch,
  showGrid,
  setShowGrid,
  fillGaps,
  setFillGaps,
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-line bg-white px-5 py-4">
      <Slider label="Items" value={count} min={3} max={60} onInput={setCount} />
      <Slider label="Columns" value={nrCols} min={1} max={12} onInput={setNrCols} />
      <Slider label="Weight A" value={weights.A} min={1} max={20} onInput={(v) => setWeight('A', v)} />
      <Slider label="Weight B" value={weights.B} min={1} max={20} onInput={(v) => setWeight('B', v)} />
      <Slider label="Weight C" value={weights.C} min={1} max={20} onInput={(v) => setWeight('C', v)} />
      <Slider label="Gap" value={gap} min={0} max={24} onInput={setGap} />
      <Slider
        label="Stretch"
        value={Number.isFinite(stretch) ? stretch : STRETCH_MAX}
        min={0}
        max={STRETCH_MAX}
        onInput={(v) => setStretch(v === STRETCH_MAX ? Number.POSITIVE_INFINITY : v)}
      />
      <Toggle label="Show grid" checked={showGrid} onChange={setShowGrid} />
      <Toggle label="Fill gaps" checked={fillGaps} onChange={setFillGaps} />
      <p className="text-[13px] text-ink/40">
        Same blocks in both panels — only the <code className="font-mono text-ink/70">rowHeight</code> prop differs.
      </p>
    </div>
  );
}
