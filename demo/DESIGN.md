# demo — design notes

Why this page looks and is built the way it is. `AGENTS.md`'s `demo/` section covers *what* is
where; this covers the reasoning, so a future change can disagree with it on purpose rather than by
accident.

## The premise

A demo for a layout library has one job: make you believe the layout engine is worth adopting, in
about eight seconds. That rules out two common shapes:

- **The docs page.** Prose with static screenshots. You can read it and still not know what the
  thing feels like.
- **The Storybook.** Every prop, every state, an args table per component. Exhaustive, and
  exhausting — it answers questions nobody has yet.

What is left is the [Frontis](https://github.com/jayf0x/frontis) framing: *here is the core idea,
here are two or three knobs, go play.* Each idea gets one **case** — as in showcase. Five cases, in
reading order, opening on the single idea the library is built around (`weight`) and only then
earning the right to talk about stretch caps and presets.

The hero is the sixth thing and the only one with real content: photographs and runs of text among
mostly-blank tiles, laid out by the library itself. It exists to answer "can this hold real
content?" before any case has to argue it. Everything after it is monochrome on purpose — the cases
are about *shape*, and a rainbow of tiles makes every layout look busy and identical.

## The direction: spec sheet

A **technical drafting sheet**, executed warm rather than cold. Concretely:

| Decision                   | Why                                                                                                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hairlines to the edge      | Every structural rule runs past the content column to the viewport edge (`line-t`/`line-b`, a 200vw pseudo-element borrowed from the Tailwind site). Structure reads as a ruled sheet, not as cards. It also forces `overflow-x: clip` on `html` — see below.       |
| Hatched margins            | The page's own margins carry the Tailwind 315° hatch between hairlines, `bg-fixed`. This does the architectural work a full-page dot lattice was doing badly: it marks *where the column is* rather than texturing everything, so it never competes with a grid.   |
| Numbered cases             | "CASE 03/05" is how you refer to one out loud, in a review or in an agent prompt. Free navigation vocabulary.                                                                                                                                                     |
| Didone titles, set heavy   | Bodoni Moda at 600. Plates have historically been titled in a high-contrast face; it is also the one thing on the page nobody mistakes for a default.                                                                                                             |
| Mono for anything measured | Every number that can change is IBM Plex Mono, tabular. If it is monospaced, you can change it.                                                                                                                                                                    |
| One accent                 | Signal vermilion, and only on things that are live: the active tick, a tile you touched, the current value, the drag handle. Colour is a state, not decoration.                                                                                                    |
| Hatch, never blank         | Negative space is hatched. On a page about how gaps get filled, an empty box reads as a bug.                                                                                                                                                                       |
| CAD crosshair              | Two hairlines tracking the pointer across the whole page. Costs two CSS custom properties per animation frame; turns the page into one instrument surface. Fine pointers only, off for reduced motion.                                                             |

Both colour schemes are first-class — light is warm paper, dark is warm ink — and the switch is
three-way (light / system / dark, lucide icons) painted before first paint by an inline script so
there is no flash.

## Motion budget

Motion is used exactly three times, and CSS does the rest:

1. **Page load** — one staggered reveal in the hero (`motion`).
2. **Case entry** — a single fade-and-rise per case, `once: true` (`motion`).
3. **Layout changes** — the library's own `animateSize` FLIP, which is the product.

Everything else — hovers, toggles, the rail ticks, the source disclosure — is a CSS transition.
Framer Motion earns its place on orchestration and nothing else; a `transition-colors` does not need
a JavaScript animation library, and `prefers-reduced-motion` short-circuits all of it.

## Controls, and why not Leva

Leva is the obvious answer and was the starting assumption. It lost on two counts: it renders its
own DOM into its own themed panel, which this design would spend more code fighting than replacing;
and "a floating dark HUD" is the opposite of a caption block on a spec sheet.

`showcase/controls.tsx` is the replacement: a schema in, typed values and a rendered panel out, in
about 180 lines against the page's own tokens.

```tsx
const SCHEMA = {
  nrCols: range("columns", 9, { min: 3, max: 16 }),
  fill: toggle("fillComponent", false),
  preset: segment("preset", "organic", ["organic", "mason"] as const),
};

const { values, panel } = useControls(SCHEMA);
// values.nrCols: number   values.fill: boolean   values.preset: "organic" | "mason"
```

Three control kinds, deliberately. A case that needs a fourth is a case turning into documentation,
and documentation belongs in the README. If a case ever genuinely needs a colour picker or a vector
pad, that is the moment to reconsider Leva — not before.

Two rules the cases follow, learned the hard way:

- **Only knobs that belong to this case.** The presets case fixes `nrCols`/`count`/`gap` as
  constants, because those are case 01's subject; repeating them would bury `seed` and `size`, which
  are the only dials a preset actually has.
- **A caption is not a second README.** If a paragraph under the controls re-explains what the
  lede already said, delete it. The only prose that survives is prose that enables an interaction —
  "click a tile", "drag the orange edge".

## Fixed stages

Each case's stage is a fixed-height box with `overflow: hidden`. The controls exist to change how
much grid there is, and a content-sized stage turns every slider drag into a page reflow — scroll
position jumps, the sticky caption slides, the case below moves. Clipping is the cheaper trade by a
long way: nobody needs to see the 40th tile, and everybody notices the page moving under them. A
short bottom fade keeps the cut reading as a window rather than a bug.

## Motion that stays subtle

**`animatePosition` stays off.** This page had it on everywhere, and it was the single biggest
source of visual noise: a control that reflows the grid moves nearly every tile, so animating
position means the whole stage swims at once. The library defaults it to `false` for exactly this
reason and the demo now respects that. `animateSize` alone is both calmer and more honest — a tile
whose *size* didn't change doesn't animate at all, so the only thing that moves is the thing the
control actually changed. On the stretch case that's 3 tiles out of 12, which is the point of the
case.

**The transition curve is ours to pick, not the library's.** `itemAnimation` is a CSS `transition`
value the library splices in verbatim (`@/showcase/motion.ts`'s `FLIP_TRANSITION`, currently `200ms
cubic-bezier(0.22, 1, 0.36, 1)` — an ease-out, so a tile decelerates into its new spot instead of
snapping there) — the library itself no longer hardcodes a duration/easing. Every case shares one
constant purely so five cases don't carry five copies of the same string; nothing stops a case from
picking its own.

Two further things were making the transitions misbehave, both fixed in the library rather than
papered over here:

1. **Measurement was viewport-relative.** `getBoundingClientRect()` absorbs anything that moves the
   grid as a whole — page scroll, an ancestor mid-transform — so tiles glitched in sync with things
   that had nothing to do with layout. Boxes are now measured relative to the grid container, where
   whatever moves container and child together contributes zero.
2. **The delta was unbounded.** FLIP replays a layout change as the transform that undoes it, so
   dragging `nrCols` from 9 to 3 started every tile hundreds of pixels away, flying in from outside
   the stage. Past ~1.5× an item's own size, it now snaps: at that scale it isn't a transition,
   it's a different layout.

The rule that follows for this page: **no `transform` on anything wrapping a `<Grid>`.** A
translating ancestor cancels out, but a scaling one still rescales the deltas — so the hero's reveal
is opacity-only.

## Square cells

`rowHeight="auto"` splits the container height into bands. That is right when a grid has to fit a
box, and wrong for a specimen: with three rows in a tall stage every tile becomes a sliver and
`weight={2}` stops looking like twice as much of anything.

So the cases measure their stage and pass a px `rowHeight` equal to the column width
(`useSquareRows`), which makes cells square and weights legible. The hero is the exception — it has
a designed height to fill, so it keeps `auto` and controls its aspect through *tile count* instead,
which is why it drops to fewer tiles on a narrow stage.

## Toward repokit

`showcase/` is written as if it already lives in another repo: it imports nothing from `showcases/`,
knows nothing about grids, and receives a case's identity through context rather than reaching for
it. `showcases/` is the half that is specific to this library. The split is the point — it is the
[repokit](https://github.com/jayf0x/repokit) boundary between "what does this repo want to showcase"
and "what frontend is required to showcase anything", drawn before there is a tool enforcing it.

Nothing here is packaged yet, and nothing should be until a second project actually wants it. Two
consumers is when a shared package stops being speculation.
