import { Slider } from '@/components/Slider';

// Clamps chosen to stay inside what the grid can render sanely on the row-height example's fixed
// panel size — see "Control limits" in the merge plan. `stretch`'s slider tops out at STRETCH_MAX;
// that top notch means "unlimited" (Grid's own default), not a literal 20.
const STRETCH_MAX = 20;
const NR_COLS_MIN = 2;
const NR_COLS_MAX = 16;
const WEIGHT_MIN = 1;
const WEIGHT_MAX = 8;
const COUNT_MIN = 3;
const COUNT_MAX = 60;
const GAP_MIN = 0;
const GAP_MAX = 24;

/** Labeled checkbox used by the control bar's boolean toggles. */
const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center gap-2 text-[13px] text-ink/60">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
    {label}
  </label>
);

export type Weights = { A: number; B: number; C: number };

/** The single control bar driving the row-height example's two panels below it. Three labeled
 * blocks (A/B/C, spread across the list) each get their own weight slider — makes it easy to see
 * that changing one item's weight resizes it in place instead of reshuffling everything around it.
 * Gap/stretch/showGrid map directly onto `<Grid>`'s own props, so this doubles as a live prop
 * showcase, not just a weight demo. Every slider is explicitly clamped (see module constants above)
 * — this is a showcase, not a Storybook control panel. */
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
}: {
  count: number;
  setCount: (v: number) => void;
  nrCols: number;
  setNrCols: (v: number) => void;
  weights: Weights;
  setWeight: (label: keyof Weights, v: number) => void;
  gap: number;
  setGap: (v: number) => void;
  stretch: number;
  setStretch: (v: number) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  fillGaps: boolean;
  setFillGaps: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-line bg-white px-5 py-4">
      <Slider label="Items" value={count} min={COUNT_MIN} max={COUNT_MAX} onInput={setCount} />
      <Slider label="Columns" value={nrCols} min={NR_COLS_MIN} max={NR_COLS_MAX} onInput={setNrCols} />
      <Slider label="Weight A" value={weights.A} min={WEIGHT_MIN} max={WEIGHT_MAX} onInput={(v) => setWeight('A', v)} />
      <Slider label="Weight B" value={weights.B} min={WEIGHT_MIN} max={WEIGHT_MAX} onInput={(v) => setWeight('B', v)} />
      <Slider label="Weight C" value={weights.C} min={WEIGHT_MIN} max={WEIGHT_MAX} onInput={(v) => setWeight('C', v)} />
      <Slider label="Gap" value={gap} min={GAP_MIN} max={GAP_MAX} onInput={setGap} />
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
