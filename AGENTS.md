# AGENTS.md

Working notes for agents/contributors on `weighted-grid`.

## What this is

A React grid — `react` is a **peer dependency** — that lays out a weighted, content-agnostic grid
filling its container. The placement engine itself is framework-agnostic (`weighted-grid/core`, see
below); React is only the one renderer that ships today. See `docs/why.md` for the product
rationale. **Read it before making structural changes.**

## Intended usage / mental model

One component, `<Grid>`, with `<GridItem>` children. There is **one engine** (a CSS-Grid span model)
and the API is deliberately small:

```tsx
<Grid nrCols={8} rowHeight={isMobile ? 50 : 100}>
  <GridItem weight={2}>…</GridItem> {/* elastic: weight sizes both axes */}
  <GridItem cols={3}>…</GridItem> {/* pin one axis, weight fills the other */}
  <GridItem cols={2} rows={2}>
    …
  </GridItem>{" "}
  {/* strict: never stretches */}
</Grid>
```

`<Grid>`'s own dimension props are `nrCols`/`nrRows`, not `cols`/`rows` — deliberately different from
`<GridItem>`'s `cols`/`rows` (a per-item _span_, not a grid-wide count). Same short name meaning two
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
  so it works for any gap unit), transparent for the track and gap-colored for a fixed 1px line
  centered in the gap. Correct by construction: never drifts from the real gutter (unlike a naive
  `100% / n` division), and never bleeds into a semi-transparent item's own interior (unlike painting
  the container itself, which showed through translucent items).
- **`animateSize`/`animatePosition`** — opt-in FLIP transforms (`useFlip` in `src/react.tsx`) for
  smooth size/position transitions on re-layout. CSS Grid line/span values aren't natively
  interpolable, so this measures each item's box pre/post-render and plays the delta back as a
  `transform` that eases to identity — not a real grid-track animation. Off by default. Playback is
  **damped** (`FLIP_STRENGTH`, currently 0.5): the item starts part-way back rather than exactly
  where it was, which keeps the direction of the change legible at a fraction of the amplitude. A
  textbook full-strength FLIP moves every item its whole layout delta at once, which on a grid is
  far more motion than a re-layout warrants. Three things the implementation must keep doing, all
  regressions that shipped once: boxes are measured
  **relative to the grid container**, not the viewport (a viewport-relative delta absorbs page
  scroll and any ancestor mid-transform, so items glitch for reasons unrelated to layout); and the
  delta is **capped** — past `FLIP_MAX_TRAVEL`/`FLIP_MAX_SCALE` the item snaps, because replaying a
  whole-grid reflow as a transform starts every item outside the container. The policy lives in the
  pure `flipTransform()` so it's testable without a DOM (`tests/react-render.test.tsx`) — note the
  caps are judged on the *raw* delta, not the damped playback, so retuning the damping can't
  silently loosen them. The per-key
  ref callbacks must also stay cached **across detach** — evicting them made the cache self-defeating
  (fresh identity → forced detach → evict → repeat), which left FLIP with no previous box to animate
  from at all.
- **`preset`** — a `PresetFn` (`({ count, nrCols, nrRows }) => Partial<GridItemProps>[]`) that
  computes default props per item; explicit `GridItem` props still win. `src/presets.ts` ships
  `masonPreset`/`organicPreset`, exported only from the `weighted-grid/presets` subpath so unused
  presets tree-shake away. `Grid` memoizes the preset call on `[preset, items.length, nrCols,
  nrRows]` — pass a stable function (wrap a custom preset in `useCallback`) or it recomputes every
  render.

`animatePosition` is off by default on purpose: any control that reflows a grid moves most of its
items, and animating that reads as the whole thing swimming. Turn it on only for grids where items
nudge rather than jump — the demo tried it everywhere and had to back it out.

Strict source order is always preserved; placement is deterministic.

## Layout

- `src/core.ts` — the whole placement engine, **JSX-free, zero `react` import** — its own entry
  point/build target (`weighted-grid/core`). `spanFor` maps each item to a col/row span; `placeSpans`
  owns placement (strict order, explicit col/row starts+spans); `fillDeadZones` grows elastic axes
  into the gaps (fair round-robin growth, per-axis via `stretchCapsOf`); `groupEmptyRects` merges
  leftover holes into rectangular filler blocks. `computeLayout` ties all four into the one call a
  non-React renderer needs (span → place → stretch → merge gaps) — the same thing `<Grid>` calls
  internally, so there's exactly one implementation of the engine, not two kept in sync by hand.
  Only types like `SpanProps`/`StretchProps` here are the minimal shape the engine reads (`weight`/
  `cols`/`rows`/`stretch`/`stretchX`/`stretchY`) — `GridItemProps` (`./react`) is a superset.
- `src/react.tsx` — `<Grid>` / `<GridItem>`, the one shipping renderer on top of `./core`. Turns JSX
  children into item props (`asGridItems`, `./utils`), calls `computeLayout`, then renders the
  result as native CSS Grid (`grid-column`/`grid-row` lines) plus `fillComponent` into the returned
  `fillerRects`.
- `src/utils.ts` — React-only helper: `asGridItems` (JSX children → ordered `GridItem` element list).
  Everything framework-agnostic lives in `src/core.ts` instead.
- `src/index.ts` — package entry; re-exports `Grid`/`GridItem` + types from `./react`. `react` is a
  **peer dependency**, not bundled — `weighted-grid/core` has no such peer and works anywhere.
- `src/presets.ts` — `PresetFn` and the built-in presets (`masonPreset`, `organicPreset`). Its own
  entry point/build target (`weighted-grid/presets`), not re-exported from `src/index.ts`, so a
  preset's code (e.g. `organicPreset`'s noise generator) tree-shakes away for anyone who doesn't
  import it. **Mission: grow this list.** `masonPreset`/`organicPreset` are two points in a much
  larger space of "auto-assign weight/cols/rows so the grid fills itself" algorithms — treemap/
  squarified layouts, stacking/packing algorithms (the removed `pre-simplify-1.2.0` engine, see
  "History" below, is prior art, not a spec to restore verbatim), bin-packing heuristics, etc. Before
  building one: **research first** — what shape does it actually produce, does an existing library
  (`d3-hierarchy`'s `treemap`, or similar) already solve the hard part, and does that library's API
  even map cleanly onto "per-item `weight`/`cols`/`rows`" or does it need its own richer preset
  options (like `masonPreset`/`organicPreset` already take). No committed design yet — that's the
  point of researching before writing the preset. Whatever ships must stay tree-shakable per preset
  (a heavier algorithm, e.g. one vendoring `d3-hierarchy`, could dwarf `core`'s own size) — if a
  preset's dependency is large, give it its own build entry/subpath instead of bundling it into the
  shared `weighted-grid/presets` entry, so anyone not importing it pays nothing.
- `tests/` — `react-render.test.tsx` (SSR output), `span-for.test.ts` (span math + `fillDeadZones`
  fairness/caps, imports `src/core.ts`), `dev-report-grid.test.ts` (QA baselines via
  `scripts/dev/dev-report-grid.ts`), `dist-imports.test.ts` (smoke-tests the actual built
  `dist/*.js` entry points — not `src/`  — so a broken `exports` map or an accidentally-bundled
  `react` fails a test, not just a manual check; `pretest` in `package.json` runs `bun run build`
  first so `bun run test`/`bun run test:run` always exercise a fresh `dist/`).
- `demo/` — the released React+TypeScript (Vite) app, importing the library from source. Not part of
  the published package. See the `demo/` section below.

## History / restoring the old modes

This grid used to have a standalone `dev/` reference app (a `Case`-as-plain-data Vite playground)
before it was folded into `demo/`. Deleted; `git log -- dev/` has it if it's ever needed again.

This grid used to have three `mode`s (`pack` / `order` / `treemap`) plus a squarified-treemap
allocator (`src/core.ts`, `layoutGrid`). Those were removed in favour of the single engine above.

- **Full old API preserved at tag `pre-simplify-1.2.0`** (commit `f28f318`) — check it out to restore
  `mode`, `treemap`, `layoutGrid`, `src/core.ts`/`src/types.ts`, and `tests/core.test.ts` verbatim.
- **The rewrite/deletion landed in commit `62448ea`** ("iteration-4") — its diff is the minimal "how
  to re-add modes later" reference.

## Repo layout

- `./config/` — `vite.config.ts`, out of the root to cut visual clutter (`package.json`'s `build`/`dev`
  scripts pass `--config` explicitly). `config/biome.json` holds the real Biome config; the root
  `biome.json` is a 2-line stub (`{ "root": true, "extends": ["./config/biome.json"] }`) — Biome 2.x's
  explicit `--config-path` refuses to treat a config living outside the actual project root as the
  *root* config (tested — errors "not a root configuration"/"nested root configuration"), but an
  `extends` stub at the real root works transparently for both the CLI and editor LSP, no
  `--config-path`/`biome.lsp.configurationPath` override needed anywhere. `config/opengrep/` holds the
  vendored security-scan rules (`config/opengrep/rules/*.yaml`) and their own `sync-rules.sh` re-sync
  helper — `scripts/opengrep-scan.sh` (which stays in `scripts/`, it's the CI-invoked entry point)
  points `RULES_DIR` there. `tsconfig.json` stays at root: TS/editor tooling auto-discovers it there
  by convention, and moving it would cost IDE intellisense for a cosmetic win.
- `./scripts/` — daily/CI scripts only (`bootstap.sh`, `deploy-pages.sh`, `opengrep-scan.sh`).
  `./scripts/dev/` holds occasional-use dev tools (`dev-report-grid.ts`, `link-local.sh`) that aren't
  part of the CI/release path. `./scripts/npm/` groups the release flow (`publish-npm.sh`,
  `patch-json.ts`, `release-notes.ts`) — `publish-npm.sh` finds its siblings via `dirname "$0"`, so
  they move together as one unit.

## Commands

```bash
bun run test        # bun:test — `pretest` builds first, so this always tests fresh dist/
bun test            # run tests against whatever's currently in dist/ (no build step)
bun run typecheck   # tsc --noEmit
bun run build       # vite lib build → dist/ (index + react + core + presets entries)
bun run format      # biome check --write
cd demo && bun run typecheck && bunx vite build   # verify the demo typechecks and compiles
bun scripts/dev/dev-report-grid.ts            # QA: every data case — holes, missed-stretch, fillComponent tiles
bun scripts/dev/dev-report-grid.ts --case=1   # QA: just reportCases[1] — the "read this before judging a screenshot" report
scripts/dev/link-local.sh        # build + copy dist/ into ../jayf0x.github.io/node_modules (local test)
```

`scripts/dev/dev-report-grid.ts` analyzes empty space in the span grid from the placement model
(`placeSpans`) — no browser needed since the grid owns explicit placement, so this model equals
what the DOM renders. It imports `demo/src/showcases/report.ts` directly (`ReportCase[]` —
plain data, no JSX), so the report can never drift from what the demo renders — there's exactly one
definition of each reference layout. `analyzeCase`/
`formatCaseReport` report on one `ReportCase` (holes, which ones `stretch` could've closed instead of
ending up in a `fillComponent` tile, and the actual merged `fillComponent` tiles the grid would
render); pass `--case=N` to scope to one case, `--cols=`/`--stretch=` to override its
`Grid` props. `analyzeSpans`/`analyzeItems`/`showcaseItems` (behind `--showcase`) are the older
Showcase-specific report. `analyzeDevGrid`/`formatDevReport` are a back-compat shim over
`analyzeCase` for the pre-existing `devItems()`-shaped unit tests. Also importable for
`tests/dev-report-grid.test.ts`.

## Conventions

- `react` is a **peer dependency** (`">=18"`), never a `dependencies` entry — the package ships zero
  runtime deps. Only `src/react.tsx` / `src/utils.ts` import it; `src/core.ts` is JSX-free and ships as
  `weighted-grid/core` with no `react` import at all, which `tests/dist-imports.test.ts` asserts
  against the actual built `dist/core.js`. Adding a `dependencies` entry — react or anything else —
  is a deliberate decision, not a drive-by. See `backlog.md`'s first entry for the migration.
- Sizing is by relative **`weight`** only. No fixed-pixel _item_ sizes — a resizable grid doesn't need
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

# demo/

The released React + TypeScript (Vite, Tailwind v4) showcase site (`.github/workflows/demo-pages.yml`
deploys it to GitHub Pages; `scripts/deploy-pages.sh`; README's "Live demo" badge). Imports the
library from source via the `weighted-grid`/`weighted-grid/react`/`weighted-grid/presets` aliases in
`demo/vite.config.ts`, so it tracks local changes. Not part of the published package. `bun run dev` /
`bun run build` / `bun run typecheck` from inside `demo/`. `@/*` is aliased to `demo/src/*`.

See `demo/DESIGN.md` for the design system (the "spec sheet" direction, tokens, motion budget) and
for why the layer split below exists — this section documents *what* is there, that doc explains
*why*.

The unit of the page is a **case** (as in showcase), numbered "CASE 03/05". Not "plate", not "story",
not "example" — one word, used in the types, the folder names, the badge, and `--case=N` on the QA
script.

## The two layers

The whole point of the structure is one boundary: **what this repo wants to showcase** vs. **the
frontend required to showcase anything**. The second half is written so it can be lifted into
another project unchanged.

- `demo/src/showcase/` — **the template layer.** Knows nothing about grids.
  - `types.ts` — `Case` (`{ id, title, lede, props?, Component }`), `CaseIndex`, `CaseRegistry`.
  - `Case.tsx` — `CaseFrame` (stage left, caption/controls/source right, sticky on wide screens) +
    `CaseProvider`. A case component owns its state and renders `<CaseFrame>`; its *identity*
    (title, number, source) arrives through context from the page, so the page never reaches into a
    case to render its controls elsewhere.
  - `controls.tsx` — schema in, typed values + a rendered panel out. Three kinds only (`range`,
    `toggle`, `segment`); a case needing a fourth is a case trying to be documentation. Not Leva:
    Leva ships its own DOM and theme, which this design would have to fight, and this is ~180 lines
    against the page's own tokens.
  - `Source.tsx` — the case's own source as a numbered listing, with copy. Deliberately not
    syntax-highlighted (see the file's own comment).
  - `Backdrop.tsx` — hatched margins flanking the content column (the Tailwind-site 315° gradient
    between hairlines, `bg-fixed`), a vignette, and the pointer-tracking CAD crosshair. The margins
    are anchored to `calc(50% + 40rem)`, i.e. half of `App.tsx`'s 80rem column — **change one and
    change the other.**
  - `Rail.tsx` — margin ruler + `useActiveCase` scroll spy. `theme.tsx` — three-way light/auto/dark
    (lucide icons), painted before first paint by the inline `_setTheme` in `index.html`.
    `icons.tsx` — the two brand marks lucide dropped. `primitives.tsx` — `Hatch`, `CropMarks`,
    `Spec`, `PropChip`, `CaseBadge`. `hooks.ts` — `useWidth`, `useSquareRows`.
- `demo/src/showcases/` — **the repo-specific layer.** One folder per case.
  - Add a case: write `demo/src/showcases/<id>/case.tsx` exporting `showcase: Case`, then add its id
    to `ORDER` in `demo/src/showcases/index.ts`. Both the module and its raw source are globbed
    (`import.meta.glob`), so "here is the source" costs nothing per case.
  - `Hero.tsx` — the library laying out its own hero, and the only place with real content: a few
    photographs and a few runs of text among mostly-blank tiles, re-weighting one blank tile every
    few seconds (paused for reduced motion and hidden tabs). Content tiles carry `stretch={0}` and a
    minimum weight so a photo is never a postage stamp and a sentence never clips.
  - `tiles.tsx` — `Tile`/`Void`/`Filler`, monochrome so layouts read as *shape*. `seed.ts` —
    deterministic opening weights, so first impressions and screenshots are stable. `DataGrid.tsx` —
    the one renderer for plain-data cases.
  - `report.ts` — the two *reference* cases (`propMatrix`, `pinnedSpans`) as plain data, exported as
    `reportCases`. `scripts/dev/dev-report-grid.ts` imports this exact array, so its QA report and
    the rendered page can never disagree; `--case=N` indexes it. `pinnedSpans` is tuned so the
    stretch case has real dead zones across the whole range of its cap — retune it against
    `--case=1 --stretch=0` if you change it.

**The stage is a fixed box and its content is clipped** (`HEIGHTS` in `Case.tsx`, `overflow-hidden`,
plus a short fade so the cut reads as a window rather than a bug). Every case has controls that
change how much grid there is, and with an auto-height stage each of those re-flowed the whole page
under the reader — scroll jumped, the sticky caption slid, the next case moved. Nobody needs to see
the 40th tile; everybody notices the page moving. Don't reintroduce a content-sized stage.

`useSquareRows` deserves a note: `rowHeight="auto"` divides *container height* into bands, which is
right for a grid fitting a box but wrong for a specimen — with few rows it stretches every tile into
a sliver and `weight={2}` stops looking like twice as much. Cases therefore measure the stage and
pass a px `rowHeight` equal to the column width. The hero keeps `auto` (it has a designed height)
and controls its aspect through *tile count* instead — which is why it renders fewer tiles on a
narrow stage.

**Don't put a `transform` on anything that wraps a `<Grid>`** — `scale` especially. The grid's FLIP
measures item boxes relative to its own container, which cancels page scroll and any ancestor
*translation*, but a scaling ancestor still rescales the deltas. Reveal animations around a grid
should be opacity-only (the hero's is); transforms belong on leaf text, as in
`jayf0x.github.io/src/pages/Home/Hero.tsx`.

`overflow-x: clip` on `html` (not `hidden`, which would break the sticky top bar) is load-bearing:
`line-t`/`line-b` draw their full-bleed rules with a 200vw pseudo-element, which overflows the page
horizontally without it.

To ask an agent "look at case 03": `bun scripts/dev/dev-report-grid.ts --case=1` gives the exact
`Grid` props, tile count, and an ASCII occupancy map (holes vs. stretch-closable vs. stuck) without a
browser; `demo/src/showcases/<id>/case.tsx` gives the exact props that produced it. Screenshot the
running app (`bun run dev` inside `demo/`) for the visual.
