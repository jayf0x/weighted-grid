# Changelog

All notable changes to `weighted-grid`. Dates are release dates; versions follow
[semver](https://semver.org/).

## 1.5.2 — 2026-07-28

- Internal and tooling changes only.

## 1.5.1 — 2026-07-27

- Internal and tooling changes only.

## 1.5.0 — 2026-07-27

- **Presets.** New `preset` prop on `<Grid>`: a `PresetFn` — `({ count, nrCols, nrRows }) =>
Partial<GridItemProps>[]` — that assigns per-item defaults. Explicit `GridItem` props still win.
- Ships `masonPreset(brick)` and `organicPreset(seed)` from the new `weighted-grid/presets`
  subpath, so an unused preset (and its code) tree-shakes away.
- Demo app rebuilt in TypeScript with one folder per example; the old `dev/` playground is gone.

## 1.4.0 — 2026-07-26

- **Per-item stretch caps.** `stretch`, `stretchX` and `stretchY` on `<GridItem>` override the
  grid-level default — let a `cols`/`rows`-pinned item grow into a gap anyway, or hold a
  weight-driven item back from eating the row.

## 1.3.0 — 2026-07-25

- **Breaking:** `<Grid>`'s dimension props are now `nrCols` / `nrRows` (were `cols` / `rows`), so
  they never read as the per-item spans of the same name.
- **Breaking:** the `mode` prop (`pack` / `order` / `treemap`) and the squarified-treemap allocator
  were removed in favour of a single engine. The old API is preserved at tag `pre-simplify-1.2.0`.
- Elasticity is now per axis: pinning `cols` freezes only the column axis, `weight` keeps driving
  rows (and vice versa).
- `fillComponent` gaps are merged into unified rectangular blocks — one node per block instead of
  one per cell — and the callback receives `{ row, col, rowSpan, colSpan }`.
- `nrRows` is a floor, not a cap: content needing more rows always gets them.
- `showGrid` guides are drawn on the real gutter, so they can't drift from the layout or bleed
  through translucent items.
- New opt-in `animateSize` / `animatePosition` FLIP transitions for re-layouts.

## 1.2.0 — 2026-07-23

- **Fair gap-stretching.** Elastic items grow into neighbouring empty cells, split evenly between
  the items flanking a gap, with a `stretch` cap on `<Grid>`.

## 1.1.x — 2026-07-23

- Simplified the React entry point (`weighted-grid/react`) and its prop surface.
- Treemap-mode fixes and interop fixes for renderers like Million.js.

## 1.0.x — 2026-07-22

- First public releases: `<Grid>` / `<GridItem>`, weight-based sizing on native CSS Grid, SSR-safe
  rendering, zero runtime dependencies.
