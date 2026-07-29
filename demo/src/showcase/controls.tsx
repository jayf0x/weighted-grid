import { useCallback, useMemo, useState } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Controls

   A schema in, typed values + a rendered panel out. Three control kinds, on
   purpose: a plate that needs a fourth is a plate trying to be documentation.

   Not Leva: Leva owns its own DOM and theme, and every plate here lives inside
   a drafting-plate design that a floating dark panel would fight. This is ~120
   lines and reuses the page's own tokens, which is cheaper than skinning
   someone else's panel and more honest than pretending it's configurable.
   ───────────────────────────────────────────────────────────────────────────── */

export type RangeControl = {
  kind: 'range';
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Rendered after the value, e.g. `px`. */
  unit?: string;
  /** Shown instead of the raw number, for values whose digits mean nothing (`Infinity`). */
  format?: (v: number) => string;
};

export type ToggleControl = { kind: 'toggle'; label: string; value: boolean };

export type SegmentControl<T extends string = string> = {
  kind: 'segment';
  label: string;
  value: T;
  options: readonly T[];
};

export type Control = RangeControl | ToggleControl | SegmentControl;
export type Schema = Record<string, Control>;

type ValueOf<C> = C extends RangeControl
  ? number
  : C extends ToggleControl
    ? boolean
    : C extends SegmentControl<infer T>
      ? T
      : never;

export type Values<S extends Schema> = { [K in keyof S]: ValueOf<S[K]> };

/* ── Builders: they exist for inference, so `segment` narrows to a union of its
      options instead of `string`. ──────────────────────────────────────────── */

export const range = (
  label: string,
  value: number,
  opts: Omit<RangeControl, 'kind' | 'label' | 'value'>,
): RangeControl => ({ kind: 'range', label, value, ...opts });

export const toggle = (label: string, value: boolean): ToggleControl => ({ kind: 'toggle', label, value });

export const segment = <const T extends string>(label: string, value: T, options: readonly T[]): SegmentControl<T> => ({
  kind: 'segment',
  label,
  value,
  options,
});

/** Typed control state + the panel that drives it. The schema is read once (initial values only) —
 * pass a module-level constant, not an inline object, if you want that to stay obvious. */
export function useControls<S extends Schema>(schema: S) {
  const initial = useMemo(
    () => Object.fromEntries(Object.entries(schema).map(([k, c]) => [k, c.value])) as Values<S>,
    [schema],
  );
  const [values, setValues] = useState<Values<S>>(initial);

  const set = useCallback(<K extends keyof S>(key: K, v: Values<S>[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  }, []);

  const reset = useCallback(() => setValues(initial), [initial]);
  const isDirty = useMemo(() => Object.keys(initial).some((k) => initial[k] !== values[k]), [initial, values]);

  const panel = <Panel schema={schema} values={values} set={set} reset={reset} isDirty={isDirty} />;

  return { values, set, reset, panel };
}

function Panel<S extends Schema>({
  schema,
  values,
  set,
  reset,
  isDirty,
}: {
  schema: S;
  values: Values<S>;
  set: <K extends keyof S>(k: K, v: Values<S>[K]) => void;
  reset: () => void;
  isDirty: boolean;
}) {
  const entries = Object.entries(schema) as [keyof S & string, Control][];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-2">
        <span className="spec">controls</span>
        <button
          type="button"
          onClick={reset}
          disabled={!isDirty}
          className="spec cursor-pointer text-accent transition-opacity duration-200 disabled:pointer-events-none disabled:opacity-0"
        >
          reset
        </button>
      </div>

      {entries.map(([key, control]) => (
        <div key={key} className="border-t border-rule py-3">
          <Row control={control} value={values[key]} onChange={(v) => set(key, v as Values<S>[typeof key])} />
        </div>
      ))}
    </div>
  );
}

function Row({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: unknown;
  onChange: (v: number | boolean | string) => void;
}) {
  if (control.kind === 'range') {
    const v = value as number;
    return (
      <label className="block">
        <span className="mb-2 flex items-baseline justify-between gap-3">
          <span className="spec">{control.label}</span>
          <span className="font-mono text-[13px] tabular-nums text-ink">
            {control.format ? control.format(v) : v}
            {control.unit && <span className="text-ink-3">{control.unit}</span>}
          </span>
        </span>
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    );
  }

  if (control.kind === 'toggle') {
    const on = value as boolean;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="group flex w-full cursor-pointer items-center justify-between gap-3"
      >
        <span className="spec group-hover:text-ink-2">{control.label}</span>
        <span
          aria-hidden
          className="relative h-4 w-8 border border-rule-strong transition-colors duration-200 group-hover:border-ink-3"
        >
          <span
            className={
              'absolute top-px bottom-px left-px w-3 transition-[translate,background-color] duration-200 ease-plate ' +
              (on ? 'translate-x-4 bg-accent' : 'bg-ink-3')
            }
          />
        </span>
      </button>
    );
  }

  return (
    <div>
      <span className="spec mb-2 block">{control.label}</span>
      <div className="flex flex-wrap gap-px bg-rule p-px">
        {control.options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={
                'flex-1 cursor-pointer px-2 py-1.5 font-mono text-[11px] whitespace-nowrap transition-colors duration-150 ' +
                (active ? 'bg-accent text-paper' : 'bg-raised text-ink-2 hover:text-ink')
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
