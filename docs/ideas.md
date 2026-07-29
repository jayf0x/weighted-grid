# Ideas

Loose brainstorm space — unlike `backlog.md` (committed, scoped work), nothing here is designed yet.
A section graduates to `backlog.md` once it has a concrete shape; it stays here while it's still
"what could this even look like."

## `PresetFn` / presets in general

`src/presets.ts` ships one shape: `PresetFn = ({ count, nrCols, nrRows }) => Partial<GridItemProps>[]`
— an algorithm that assigns default `weight`/`cols`/`rows` per item, so a grid can fill itself with
near-zero config. `masonPreset`/`organicPreset` are two points in a much larger space; see
`backlog.md`'s "More presets" entry for the constraint that governs all of them (tree-shakable per
preset — a preset with a real dependency gets its own subpath, not a place in the shared
`weighted-grid/presets` entry).

Candidate directions, not yet researched:

- **Treemap/squarified** — the classic weighted-area subdivision (`d3-hierarchy`'s `treemap()`,
  vendored for reference at `.idea/d3-hierarchy/`). Prior art: the removed `pre-simplify-1.2.0`
  engine did this as a whole layout mode (`layoutGrid`), not a preset — that's a different model
  (a fixed allocator, not per-item `weight`/`cols`/`rows` defaults) and shouldn't be restored
  verbatim, but the math is worth revisiting through the `PresetFn` shape.
- **Bin-packing heuristics** — shelf/guillotine packers, more "get everything to fit tightly" than
  `organicPreset`'s noise-driven variety.
- **Stacking/masonry variants** — `masonPreset` is one column-flow heuristic; there's room for
  others (e.g. balanced-height columns vs. strict row-major).

Before building any of these: what does the algorithm actually *produce* visually, does an existing
library already solve the hard part, and does that library's API map cleanly onto "one `weight`/
`cols`/`rows` per item" — or does it need its own richer options object the way `masonPreset`/
`organicPreset` already do. No design committed on purpose.

## Animation presets (`itemAnimation`)

`itemAnimation` (added after the FLIP damping/easing rewrite — see `AGENTS.md`'s
`animateSize`/`animatePosition`/`itemAnimation` entry) is a raw CSS `transition` value the caller
supplies. Floated but deliberately not built:

- **A small set of exported curve strings** — `bounce`/`wiggle`/`spring`/`glide`, the same
  tree-shakable-subpath pattern as `presets.ts` (e.g. `weighted-grid/motion`). Low cost since
  they're just strings, but genuinely YAGNI until more than one consumer wants the same curve —
  right now the demo covers that with its own one-line `demo/src/showcase/motion.ts` constant.
- **`animateFn={(index, box) => ...}`** — a function given each item's index and post-layout box
  (`{ left, top, width, height }`), returning a transform or transition per item. This is real
  added flexibility `itemAnimation` can't express — per-item stagger (a "wave" effect keyed off
  index), content-aware easing — but it's a bigger API surface than a CSS string, and nothing in
  the demo needs it yet. Worth another look if a real case wants per-item staggering; until then,
  `transition-delay` tricks via CSS `nth-child` selectors on the rendered markup may already get
  most of the way there without a new prop.
