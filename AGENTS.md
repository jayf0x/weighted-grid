# AGENTS.md

Working notes for agents/contributors on `weighted-grid`.

## What this is

A React grid (zero runtime deps; `react` is a peer dep) that lays out a weighted, content-agnostic
grid filling its container. See `docs/why.md` for the product rationale. **Read it before making
structural changes.**

## Intended usage / mental model

One component, `<Grid>`, with `<GridItem>` children. There is **one engine** (a CSS-Grid span model)
and the API is deliberately small:

```tsx
<Grid nrCols={8} rowHeight={isMobile ? 50 : 100}>
  <GridItem weight={2}>…</GridItem>       {/* elastic: weight sizes both axes */}
  <GridItem cols={3}>…</GridItem>          {/* pin one axis, weight fills the other */}
  <GridItem cols={2} rows={2}>…</GridItem> {/* strict: never stretches */}
</Grid>
```

`<Grid>`'s own dimension props are `nrCols`/`nrRows`, not `cols`/`rows` — deliberately different from
`<GridItem>`'s `cols`/`rows` (a per-item *span*, not a grid-wide count). Same short name meaning two
different things in the same JSX block was a real, reported point of confusion; keep them distinct.

- **Sizing** — `weight` is flexbox-`flex`-style ("how much of the grid do I get"). Pin an axis with
  `cols`/`rows` and `weight` fills the other; pin neither and it drives both. Elasticity is **per
  axis**: `cols={2}` pins only the column axis (it never stretches horizontally) while `weight` keeps
  the row axis elastic, and vice versa. Only an item with **both** `cols` and `rows` pinned is fully
  strict on both axes.
- **Empty cells** — one pass, not a mode switch: elastic axes **`stretch`** (default `Infinity`, `0` =
  off) fairly into the gaps first, split evenly between the items flanking a gap, never all to one
  side. Whatever `stretch` can't reach — because it's capped, boxed in, or there's no elastic neighbor
  — stays a hole. Adjacent holes merge into unified rectangular blocks (`groupEmptyRects`); pass
  **`fillComponent`** to render one node per block instead of one per cell. Omit it and those cells
  just stay empty.
- **`nrRows`** — a floor, not a cap. Content that needs more rows than declared always gets them (same
  as CSS Grid's own implicit-row overflow); setting it larger than content only reserves headroom for
  `stretch`. Never let a `rowCount` used for occupancy tracking be smaller than what placement actually
  needs — that's what silently broke `stretch`/`fillComponent` for any row past a too-small `nrRows` in
  the past (see the `nrRows` prop test in `react-render.test.tsx`). Omit it; most grids never need it.
- **`rowHeight`** — `"auto"` (default, split the parent height into row bands) or a px/string value
  (fixed per-row height, grid grows downward).
- **`showGrid`** — a `repeating-linear-gradient` whose period is `track + gap` (both in one `calc()`,
  so it works for any gap unit), transparent for the track and gap-colored for exactly one `gap`
  width. Correct by construction: never drifts from the real gutter (unlike a naive `100% / n`
  division), and never bleeds into a semi-transparent item's own interior (unlike painting the
  container itself, which showed through translucent items).
- **`animateSize`/`animatePosition`** — opt-in FLIP transforms (`useFlip` in `src/react.tsx`) for
  smooth size/position transitions on re-layout. CSS Grid line/span values aren't natively
  interpolable, so this measures each item's box pre/post-render and plays the delta back as a
  `transform` that eases to identity — not a real grid-track animation. Off by default.

Strict source order is always preserved; placement is deterministic.

## Layout

- `src/react.tsx` — `<Grid>` / `<GridItem>` and the whole engine. `spanFor` maps each item to a
  col/row span; the grid owns placement (`placeSpans`, strict order, explicit `grid-column`/`grid-row`
  lines), grows elastic axes into the gaps (`fillDeadZones`), then renders `fillComponent` into
  whatever holes are left, merged via `groupEmptyRects`.
- `src/utils.ts` — placement + render helpers: `spanFor`, `placeSpans`, `packedRowCount`,
  `fillDeadZones` (fair round-robin growth, per-axis via `elasticityOf`), `groupEmptyRects` (merges
  leftover holes into rectangular filler blocks), `toCss`, `asGridItems`.
- `src/index.ts` — package entry; re-exports `Grid`/`GridItem` + types from `./react`.
- `tests/` — `react-render.test.tsx` (SSR output), `span-for.test.ts` (span math + `fillDeadZones`
  fairness/caps), `dev-report-grid.test.ts` (QA baselines via `scripts/dev-report-grid.ts`).
- `demo/` — standalone React (Vite) app importing the library from source. Not part of the package.

## History / restoring the old modes

This grid used to have three `mode`s (`pack` / `order` / `treemap`) plus a squarified-treemap
allocator (`src/core.ts`, `layoutGrid`). Those were removed in favour of the single engine above.

- **Full old API preserved at tag `pre-simplify-1.2.0`** (commit `f28f318`) — check it out to restore
  `mode`, `treemap`, `layoutGrid`, `src/core.ts`/`src/types.ts`, and `tests/core.test.ts` verbatim.
- **The rewrite/deletion landed in commit `62448ea`** ("iteration-4") — its diff is the minimal "how
  to re-add modes later" reference.

## Commands

```bash
bun test            # run all tests (bun:test)
bun run typecheck   # tsc --noEmit
bun run build       # vite lib build → dist/ (index + react entries)
bun run format      # biome check --write
cd demo && bunx vite build   # verify the demo compiles
bun scripts/dev-report-grid.ts   # QA: dev/App.jsx holes, missed-stretch cells, fillComponent tile count
scripts/link-local.sh        # build + copy dist/ into ../jayf0x.github.io/node_modules (local test)
```

`scripts/dev-report-grid.ts` analyzes empty space in the span grid from the placement model
(`placeSpans`) — no browser needed since the grid owns explicit placement, so this model equals
what the DOM renders. `analyzeDevGrid`/`formatDevReport` report on the live `dev/src/App.jsx` config
(holes, which ones `stretch` could've closed instead of ending up in a `fillComponent` tile, and the
actual merged `fillComponent` tiles the grid would render); `devItems()` is a *verbatim* copy of
`dev/src/App.jsx`'s `CARDS` — keep them in sync when the dev app changes, or the report stops meaning
anything. `analyzeSpans`/`analyzeItems`/`showcaseItems` (behind `--showcase`) are the older
Showcase-specific report. Also importable for `tests/dev-report-grid.test.ts`.

## Conventions

- **Zero runtime dependencies** in the published package — keep it that way (react is a peer dep).
- Sizing is by relative **`weight`** only. No fixed-pixel *item* sizes — a resizable grid doesn't need
  them (`rowHeight` is the one per-row escape hatch).
- Rendering is **native CSS Grid**; the JS only computes placement. Don't reimplement layout the
  browser already does.
- Placement stays **gap-free-aware, overlap-free, and order-preserving**. Any change to `placeSpans` /
  `fillDeadZones` ships with a test proving those invariants still hold.
- Boolean props/state get an `is`/`should` prefix internally; public boolean props may drop it for
  ergonomics (`showGrid`).
- Biome for format/lint (`biome.json`). TS strict.

## Reference material

`.idea/d3-hierarchy/` is a vendored clone of d3-hierarchy — it was the source of the (now removed)
squarified treemap allocator. **No longer referenced by any shipping code**; safe to delete if the
old modes aren't being restored from git.
