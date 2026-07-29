# Demo redesign plan

Why this exists: the demo works, but it reads as a component catalog (five similar-looking grids
of numbered squares, scrolled top to bottom) instead of a product moment. First-time visitors
should feel *this grid is different* within one scroll, and *I could wire this up in five
minutes* by the time they leave. This doc is the concrete plan; the "Status" line on each section
says what's actually landed in this pass vs. left for a follow-up.

## Direction: lean the blueprint motif into the whole site, not just `Void`

The page already has the right seed — `Void`'s diagonal hatch, the `ip-snake` border, the
cream/ink/burnt-orange palette, Fraunces+IBM Plex. That's a *drafting table* aesthetic: technical,
precise, tangible. Today it only shows up inside empty grid cells. The redesign makes it the skin
of the whole page:

- **Sidelines** — two hairline verticals bounding the content column, full page height, with tick
  marks at intervals (ruler-margin, technical-drawing feel). Pure CSS on a wrapping frame.
- **Plate numbering** — each example is "PLATE 01/07" in mono type, not just a title, with small
  corner crop-marks on its bordered box.
- **Faint sitewide grid** — a very low-alpha `repeating-linear-gradient` behind everything, same
  formula `Void`/`showGrid` already use, so it never feels like a bolted-on texture.

Status: **implemented** (`style.css`, `components/Blueprint.tsx`, `ExampleSection`/example chrome).

## Example lineup: replace "five similar squares" with range

Old order: prop-matrix → row-height → pinned-spans → presets → organic-mosaic (organic last,
buried after four visually-similar square grids).

New order — open on the most different-looking thing, save the exhaustive/reference examples for
after the reader is already convinced:

1. **`organic-raw`** (new, split from `organic-mosaic`) — flat-color tiles, no images, and
   deliberately **overflows horizontally** instead of vertically (fixed row band, `overflow-x:
   auto`) — the opposite scroll axis from every other example on the page. This is the "oh, this
   isn't just squares" opener.
2. **`organic-styled`** (the other half of the split) — same preset, real content this time: the
   existing photo `Card`s plus gradient-overlay captions. Reads like an actual app section, not a
   demo.
3. **`responsive-cols`** (new) — one grid, `nrCols` driven by a breakpoint (fewer columns under
   768px), with a note + a simulated-width toggle in its rail panel so the effect is visible
   without actually resizing the browser. Directly answers "does this work on mobile."
4. **`prop-matrix`** (existing, unchanged data) — the exhaustive weight/cols/rows/strict reference.
   Repositioned as "how it works," not the front door.
5. **`pinned-spans`** (existing, unchanged data) — span grid + weighted squares.
6. **`row-height`** (existing, interactive) — auto vs. fixed rowHeight, controls move into the
   rail (see below).
7. **presets gallery** (existing `ModesExample`) — small side-by-side preset previews.

`prop-matrix`/`pinned-spans` keep their exact `Example` data untouched — `dev-report-grid.ts`
filters on `kind: 'data'`, not array position, so reordering doesn't touch its `--case=N`
addressing or QA baselines (verified: the filter runs before indexing).

Status: **implemented** for 1–3 and the reorder; 4–7 carried over as-is (data untouched), only
their position and rail wiring changed.

## Sticky control rail: one rail, swapped per example

The row-height example's "one control bar drives two panels" idea was the best mechanic on the
page — it just needed to (a) leave the document flow and become a persistent side panel, and (b)
generalize past one example.

Architecture (`utils/controlsRail.tsx`):

- A single `ControlsRailProvider` high in `App.tsx` holds `activeId` + `activeNode` state and a
  mutable `id -> ReactNode` registry ref.
- Each example calls `useSectionControls(id, controlsNode)`, which (1) registers its control panel
  JSX into the registry every render, and (2) wraps an `IntersectionObserver` on the section's root
  element with an activation band near the top of the viewport (`rootMargin: '-15% 0px -70% 0px'`)
  — whichever section crosses that band becomes `activeId`.
- `<ControlRail>` just renders `registry.get(activeId)`. No per-example special-casing in the rail
  itself — swapping "what the controls mean" per example is entirely the examples' own
  responsibility (each owns its state and hands the rail a plain `ReactNode`).
- Static examples (`prop-matrix`, `pinned-spans`) register a small read-only panel (title + tile
  count + the exact `Grid` props in effect) instead of sliders — they're references, not toys, but
  they still occupy the rail so the panel never goes blank while scrolling past them.
- Desktop: `<aside>` is `sticky top-*` beside the content column. Mobile (`<lg`): the rail
  collapses to a bar docked under the header showing just the active example's controls, content
  column goes full width.

Status: **implemented**.

## What's explicitly left as follow-up (not in this pass)

- A real hero moment above example 1 (headline + one-line pitch + maybe a tiny live grid as a
  favicon-scale visual) — the reorder gets organic-raw up top, but a dedicated hero section with
  copy is still worth a dedicated pass.
- Extending rail controls to the presets gallery (`ModesExample`) — currently unregistered, same
  static-panel treatment as prop-matrix would be the natural next step.
- Revisiting `row-height`'s two-panel layout now that its controls live in the rail instead of
  stacked above the panels (there's now unused vertical space where `<Controls>` used to sit).
- Deciding whether `pre-simplify-1.2.0`'s treemap mode is worth resurrecting as an 8th example —
  out of scope here, tracked in `AGENTS.md`'s History section already.
