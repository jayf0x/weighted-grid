# demo — design notes

Why this page looks and is built the way it is. `AGENTS.md`'s `demo/` section covers *what* is
where; this covers the reasoning, so a future change can disagree with it on purpose rather than by
accident.

## The premise

A demo for a layout library has one job: make you believe the layout engine is worth adopting, in
about eight seconds. That rules out two common shapes:

- **The docs page.** Prose with static screenshots. You can read it and still not know what the
  thing feels like.
- **The Storybook.** Every prop, every state, an args table per component. Exhaustive, and exhausting
  — it answers questions nobody has yet.

What is left is the [Frontis](https://github.com/jayf0x/frontis) framing: *here is the core idea,
here are two or three knobs, go play.* Each idea gets one **plate**. Six plates, in reading order,
opening on the single idea the library is built around (`weight`) and only then earning the right to
talk about `stretch` caps and presets.

## The direction: spec sheet

A **technical drafting plate**, executed warm rather than cold. Concretely:

| Decision                | Why                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hairlines to the edge   | Every structural rule runs past the content column to the viewport edge (`line-t`/`line-b`, a 200vw pseudo-element borrowed from the Tailwind site). Structure reads as a ruled sheet, not as cards.  |
| Numbered plates         | "PLATE 03/06" is how you refer to one out loud, in a review or in an agent prompt. Free navigation vocabulary.                                                                                        |
| Didone titles           | Bodoni Moda. Plates have historically been titled in a high-contrast face; it is also the one thing on the page nobody mistakes for a default.                                                        |
| Mono for anything measured | Every number that can change is IBM Plex Mono, tabular. If it is monospaced, you can change it.                                                                                                    |
| One accent              | Signal vermilion, and only on things that are live: the active tick, a touched tile, the current value. Colour is a state, not decoration — which is also why the tiles are monochrome.                |
| Hatch, never blank      | Negative space is a 315° hatch (lifted from Tailwind's own docs treatment). On a page about how gaps get filled, an empty box reads as a bug.                                                          |
| CAD crosshair           | Two hairlines tracking the pointer across the whole page. Costs two CSS custom properties per animation frame; turns the page into one instrument surface. Fine pointers only, off for reduced motion. |

Both colour schemes are first-class — light is warm paper, dark is warm ink, and the switch is
three-way (day / auto / night) painted before first paint by an inline script so there is no flash.

## Motion budget

Motion is used exactly three times, and CSS does the rest:

1. **Page load** — one staggered reveal in the hero (`motion`).
2. **Plate entry** — a single fade-and-rise per plate, `once: true` (`motion`).
3. **Layout changes** — the library's own `animateSize`/`animatePosition` FLIP, which is the product.

Everything else — hovers, toggles, the rail ticks, the source disclosure — is a CSS transition.
Framer Motion earns its place on orchestration and nothing else; a `transition-colors` does not need
a JavaScript animation library, and `prefers-reduced-motion` short-circuits all of it.

## Controls, and why not Leva

Leva is the obvious answer and was the starting assumption. It lost on two counts: it renders its own
DOM into its own themed panel, which this design would spend more code fighting than replacing; and
"a floating dark HUD" is the opposite of a caption block on a spec sheet.

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

Three control kinds, deliberately. A plate that needs a fourth is a plate turning into
documentation, and documentation belongs in the README. If a plate ever genuinely needs a colour
picker or a vector pad, that is the moment to reconsider Leva — not before.

## Square cells

`rowHeight="auto"` splits the container height into bands. That is right when a grid has to fit a
box, and wrong for a specimen: with three rows in a tall stage every tile becomes a sliver and
`weight={2}` stops looking like twice as much of anything.

So most plates measure their stage and pass a px `rowHeight` equal to the column width
(`useSquareRows`), which makes cells square and weights legible. The one plate that does *not* is
plate 06 — the plate about `rowHeight` itself.

## Toward repokit

`showcase/` is written as if it already lives in another repo: it imports nothing from `showcases/`,
knows nothing about grids, and receives a plate's identity through context rather than reaching for
it. `showcases/` is the half that is specific to this library. The split is the point — it is the
[repokit](https://github.com/jayf0x/repokit) boundary between "what does this repo want to showcase"
and "what frontend is required to showcase anything", drawn before there is a tool enforcing it.

Nothing here is packaged yet, and nothing should be until a second project actually wants it. Two
consumers is when a shared package stops being speculation.
