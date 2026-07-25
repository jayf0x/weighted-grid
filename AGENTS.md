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
<Grid cols={8} rows={4} rowHeight={isMobile ? 50 : 100}>
  <GridItem weight={2}>…</GridItem>       {/* elastic: weight sizes both axes */}
  <GridItem cols={3}>…</GridItem>          {/* pin one axis, weight fills the other */}
  <GridItem cols={2} rows={2}>…</GridItem> {/* strict: never stretches */}
</Grid>
```

- **Sizing** — `weight` is flexbox-`flex`-style ("how much of the grid do I get"). Pin an axis with
  `cols`/`rows` and `weight` fills the other; pin neither and it drives both. An item with an explicit
  `cols` **or** `rows` is *strict* and never stretches.
- **Empty cells** — one pass, not a mode switch: weight-only items **`stretch`** (default `Infinity`,
  `0` = off) fairly into the gaps first, split evenly between the items flanking a gap, never all to
  one side. Whatever `stretch` can't reach — because it's capped, boxed in, or there's no elastic
  neighbor — stays a hole; pass **`fillComponent`** to render a node there instead. Omit it and those
  cells just stay empty.
- **`rowHeight`** — `"auto"` (default, split the parent height into `rows` bands) or a px/string value
  (fixed per-row height, grid grows downward). `showGrid` toggles a debug overlay.

Strict source order is always preserved; placement is deterministic.

## Layout

- `src/react.tsx` — `<Grid>` / `<GridItem>` and the whole engine. `spanFor` maps each item to a
  col/row span; the grid owns placement (`placeSpans`, strict order, explicit `grid-column`/`grid-row`
  lines), grows weight items into the gaps (`fillDeadZones`), then renders `fillComponent` in whatever
  holes are left.
- `src/utils.ts` — placement + render helpers: `spanFor`, `placeSpans`, `packedRowCount`,
  `fillDeadZones` (fair round-robin growth), `isElasticItem`, `toCss`, `asGridItems`.
- `src/index.ts` — package entry; re-exports `Grid`/`GridItem` + types from `./react`.
- `tests/` — `react-render.test.tsx` (SSR output), `span-for.test.ts` (span math + `fillDeadZones`
  fairness/caps), `dev-report-grid.test.ts` (QA baselines via `scripts/dev-report-grid.ts`).
- `demo/` — standalone React (Vite) app importing the library from source. Not part of the package.

## History / restoring the old modes

This grid used to have three `mode`s (`pack` / `order` / `treemap`) plus a squarified-treemap
allocator (`src/core.ts`, `layoutGrid`). Those were removed in favour of the single engine above.

- **Full old API preserved at tag `pre-simplify-1.2.0`** (commit `f28f318`) — check it out to restore
  `mode`, `treemap`, `layoutGrid`, `src/core.ts`/`src/types.ts`, and `tests/core.test.ts` verbatim.
- **The rewrite/deletion landed in commit `__DELETION_COMMIT__`** (this branch) — its diff is the
  minimal "how to re-add modes later" reference.

## Commands

```bash
bun test            # run all tests (bun:test)
bun run typecheck   # tsc --noEmit
bun run build       # vite lib build → dist/ (index + react entries)
bun run format      # biome check --write
cd demo && bunx vite build   # verify the demo compiles
bun scripts/dev-report-grid.ts   # QA: dev/App.jsx holes, missed-stretch cells, filler-repeat clusters
scripts/link-local.sh        # build + copy dist/ into ../jayf0x.github.io/node_modules (local test)
```

`scripts/dev-report-grid.ts` analyzes empty space in the span grid from the placement model
(`placeSpans`) — no browser needed since the grid owns explicit placement, so this model equals
what the DOM renders. `analyzeDevGrid`/`formatDevReport` report on the live `dev/src/App.jsx` config
(holes, which ones `stretch` could've closed instead of a repeated `fillComponent` tile, and
filler-repeat runs); `analyzeSpans`/`analyzeItems`/`showcaseItems` (behind `--showcase`) are the
older Showcase-specific report. Also importable for `tests/dev-report-grid.test.ts`.

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
