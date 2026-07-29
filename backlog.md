# Backlog

- ~~**Non-React consumers.**~~ Done. `src/core.ts` is the JSX-free placement engine (`spanFor`,
  `placeSpans`, `fillDeadZones`, `groupEmptyRects`, `computeLayout`), shipped as its own
  `weighted-grid/core` entry point with zero `react` import — verified by
  `tests/dist-imports.test.ts` against the actual built `dist/core.js`. `react` moved from
  `dependencies` to `peerDependencies` (`package.json`); `src/react.tsx` is now a thin renderer on
  top of `core`, kept as the one shipping UI layer — not deprecated, just no longer the only place
  the engine lives. Web components were considered and rejected (see conversation/PR discussion):
  the engine was already pure data in/out, so a custom-element wrapper would've added a whole new
  runtime to maintain for no capability `core` doesn't already give a non-React consumer.

- **More presets — research first, not a spec yet.** `src/presets.ts` (`masonPreset`,
  `organicPreset`) proves the shape: an algorithm that turns `{ count, nrCols, nrRows }` into
  per-item `weight`/`cols`/`rows` defaults, shipped as its own tree-shakable subpath so unused
  presets cost nothing. That shape can carry much more: treemap/squarified layouts, stacking/bin
  packing, the kind of allocator the old pre-simplify engine had (tag `pre-simplify-1.2.0`, see
  `AGENTS.md`'s "History" section — prior art, not something to restore verbatim; it was a
  different model, `layoutGrid` over a fixed treemap, not a `weight`-driven preset).

  **Next step is research, not implementation:** what does each candidate algorithm actually
  produce visually, is there a well-tested library that already solves the hard part (`d3-hierarchy`
  is vendored for reference at `.idea/d3-hierarchy/`; there may be smaller/better-maintained
  alternatives worth a look), and does that library's output even map cleanly onto "one `weight`/
  `cols`/`rows` per item," or does it need a richer per-preset options object (`masonPreset`/
  `organicPreset` already take their own `Options` types — see `src/presets/`). No committed
  design yet on purpose.

  **Constraint for whatever ships:** keep it tree-shakable *per preset*. Named exports from
  `src/presets/index.ts` already tree-shake with no side effects (`sideEffects: false`), so two
  small presets sharing one entry is fine — but a preset built on a real dependency (e.g. vendoring
  `d3-hierarchy` for a treemap) could dwarf `core`'s own size. If a preset's weight gets large,
  give it its own build entry/subpath (a `weighted-grid/presets/treemap`-shaped export) instead of
  folding it into the shared `presets` entry, so anyone who doesn't import it pays nothing.
