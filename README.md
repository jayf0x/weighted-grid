# weighted-grid

<!-- README_HEAD:START -->

[![npm version](https://img.shields.io/npm/v/weighted-grid)](https://www.npmjs.com/package/weighted-grid)
[![license](https://img.shields.io/npm/l/weighted-grid)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](./tsconfig.json)
[![CI](https://github.com/jayf0x/weighted-grid/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/weighted-grid/actions/workflows/ci.yml)

<!-- README_HEAD:END -->

**Weight in, layout out.** Define a `weight` or pin an axis with `cols`/`rows` and
the grid fills its container — fairly stretching elastic items into empty space, never leaving a
hole an item could've grown into. No coordinates, no manual math.
Native CSS Grid under the hood; the JS only computes placement 🚀

![Preview](./assets/preview.png)

**[▶ Live demo](https://jayf0x.github.io/weighted-grid/)** · ⭐ [Star the repo](https://github.com/jayf0x/weighted-grid) if it's useful

## Why this, not X

|              | weighted-grid                                               | CSS Grid `auto-flow` alone                        | `react-grid-layout`                           |
| ------------ | ----------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Sizing model | relative `weight`, per-axis pinning                         | fixed spans you compute by hand                   | fixed `x/y/w/h` per item                      |
| Empty space  | fair `stretch` into gaps, then `fillComponent` for the rest | stays empty, or you write the fill logic yourself | stays empty                                   |
| Setup        | drop in children, tag a few                                 | write every item's grid-column/row by hand        | wire up a layout array + drag/resize handlers |
| Use case     | content-agnostic dashboards, feeds, galleries               | anything you're happy to hand-place               | user-editable, draggable dashboards           |
| Deps         | zero (react peer)                                           | zero                                              | react + interact.js-style drag internals      |

> <small> Want drag support or other features? Create [an issue](https://github.com/jayf0x/weighted-grid/issues/new).</small>

## Features

- **`weight`** sizes items flexbox-`flex`-style; pin one axis with `cols`/`rows` and `weight`
  fills the other, or pin neither and `weight` drives both (equal weights → equal squares)
- Elastic items **`stretch`** into empty space fairly — split evenly between the items flanking a
  gap, never all to one side — with an optional `fillComponent` to plug whatever's left over
  merged into unified tiles, not one per cell
- Optional `animateSize`/`animatePosition` for smooth transitions when layout changes
- Full TypeScript types, ESM + CJS builds, zero runtime dependencies (`react` is a peer)

## Install

```bash
bun add weighted-grid
# npm install weighted-grid
```

## Quick start

The bar for entry is one prop — drop in children, tag a couple with `weight`, done:

```tsx
import { Grid, GridItem } from "weighted-grid/react";

<Grid nrCols={7}>
  <GridItem weight={4}>hero</GridItem>
  <GridItem>a</GridItem>
  <GridItem>b</GridItem>
  <GridItem>c</GridItem>
</Grid>;
```

But `weight` is only the entry point. The same engine handles per-axis pinning, fair gap-filling,
and a fallback slot for whatever's left over — a dashboard, not a toy grid:

```tsx
<Grid
  nrCols={12}
  stretch={2}
  fillComponent={(rect) => <Placeholder {...rect} />}
>
  {/* elastic on both axes — weight sizes rows and columns */}
  <GridItem weight={4}>hero</GridItem>

  {/* pin one axis, weight keeps driving the other: 3 cols wide, weight sets the height */}
  <GridItem cols={3} weight={2}>
    featured
  </GridItem>

  {/* fully strict — pin both axes, never stretches even when neighbors have room */}
  <GridItem cols={2} rows={2}>
    pinned
  </GridItem>

  {/* everything else is a plain 1x1 cell that stretches to close gaps automatically */}
  {items.map((item) => (
    <GridItem key={item.id}>{item.label}</GridItem>
  ))}
</Grid>
```

`stretch` grows elastic axes into empty space fairly (split evenly between the items flanking a
gap) before anything is left as a hole; `fillComponent` renders into whatever's left, merged into
unified rectangular blocks instead of one node per cell. Full prop reference below.

## `<Grid>` props

| Prop              | Type                         | Default    | Description                                                                                                                                                        |
| ----------------- | ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nrCols`          | `number`                     | `7`        | Number of columns. Always scales with the container width.                                                                                                         |
| `nrRows`          | `number`                     | —          | Minimum row tracks. Omit it (recommended) and the grid auto-counts what its items occupy — it's a floor, not a cap: content that needs more rows always gets them. |
| `gap`             | `number \| string`           | `8`        | Spacing between items (`px` if a number).                                                                                                                          |
| `rowHeight`       | `"auto" \| number \| string` | `"auto"`   | `"auto"`: stretch to fill the parent's height (the parent needs a height). A number/string: fixed height per row, the grid grows downward.                         |
| `stretch`         | `number`                     | `Infinity` | Extra cells an elastic axis may grow, per axis, to absorb gaps (`0` off). Runs before `fillComponent`, not instead of it.                                          |
| `fillComponent`   | `ReactNode`                  | —          | Rendered in whatever `stretch` couldn't reach, merged into unified rectangular blocks. Omit it and those cells just stay empty.                                    |
| `showGrid`        | `boolean`                    | `false`    | Debug overlay: tints the real `gap` gutter so column/row boundaries are always exactly where items are.                                                            |
| `animateSize`     | `boolean`                    | `false`    | Smoothly transition an item's on-screen size when its span changes (FLIP transform).                                                                               |
| `animatePosition` | `boolean`                    | `false`    | Same mechanism as `animateSize`, but for position.                                                                                                                 |
| `className`       | `string`                     | —          | Applied to the outer container.                                                                                                                                    |
| `style`           | `CSSProperties`              | —          | Merged into the outer container's inline style.                                                                                                                    |

## `<GridItem>` props

| Prop     | Type     | Default | Description                                                                                                              |
| -------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `weight` | `number` | `1`     | Relative size, flexbox-`flex`-style. Fills whichever axis isn't pinned by `cols`/`rows`; pin neither and it drives both. |
| `cols`   | `number` | —       | Exact column span. Pins the horizontal axis (never stretches); `weight` keeps driving rows unless `rows` is also pinned. |
| `rows`   | `number` | —       | Exact row span. Pins the vertical axis (never stretches); `weight` keeps driving columns unless `cols` is also pinned.   |

Elasticity is per axis: an item with only `cols` set still stretches vertically by `weight`. Only
an item with **both** `cols` and `rows` pinned is fully strict on both axes. See
[`AGENTS.md`](./AGENTS.md) for the full mental model.

## Development

```bash
bun install
bun run test          # bun test
bun run typecheck
bun run build         # vite → dist/ (ESM + CJS + .d.ts)
bun run format        # biome check --write
bun run demo:dev      # the demo app (demo/) — examples, controls, QA info toggle
```

## License

[MIT](./LICENSE) © [jayF0x](https://github.com/jayf0x)
