# weighted-grid

<!-- README_HEAD:START -->

[![npm version](https://img.shields.io/npm/v/weighted-grid)](https://www.npmjs.com/package/weighted-grid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/weighted-grid?label=minzipped)](https://bundlephobia.com/package/weighted-grid)
[![zero deps](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![types](https://img.shields.io/npm/types/weighted-grid)](./src/react.tsx)
[![CI](https://github.com/jayf0x/weighted-grid/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/weighted-grid/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/weighted-grid)](./LICENSE)

<!-- README_HEAD:END -->

**Weight in, layout out.** 🧩

Say how _big_ each item should feel — not where it goes. The grid places everything in source
order, fills its container, and grows elastic items into leftover space so you don't end up
staring at a hole an item could have filled. Native CSS Grid does the rendering; the JS only
decides spans.

![Preview](./assets/preview.png)

**[▶ Play with the live demo](https://jayf0x.github.io/weighted-grid/)**

> ⭐ Star the [repo](https://github.com/jayf0x/weighted-grid) if this saved you an afternoon.

## Why not just CSS Grid?

|                | weighted-grid                                     | plain CSS Grid `auto-flow`         | `react-grid-layout`             |
| -------------- | ------------------------------------------------- | ---------------------------------- | ------------------------------- |
| You specify    | relative importance                               | every span, by hand                | `x/y/w/h` per item              |
| Empty space    | absorbed fairly, then filled                      | stays empty                        | stays empty                     |
| Setup          | drop in children, tag a few                       | write the placement yourself       | layout array + drag handlers    |
| Best for       | dashboards, feeds, galleries, unknown item counts | layouts you're happy to hand-place | user-editable draggable boards  |
| Runtime deps   | zero (`react` is a peer)                          | zero                               | react + drag internals          |

Use plain CSS Grid when you know the layout up front. Reach for this when the item count is
whatever the API returned and you still want it to look deliberate. Not a drag-and-drop library,
and not trying to be — want that? [Open an issue](https://github.com/jayf0x/weighted-grid/issues/new).

## What's new

<!-- WHATSNEW:START -->

| Version | Highlights |
| ------- | ---------- |
| `1.5.0` | 🎨 **Presets** — `masonPreset` / `organicPreset` on the `weighted-grid/presets` subpath |
| `1.4.0` | Per-item `stretch` / `stretchX` / `stretchY` caps — let a pinned item grow, or hold an elastic one back |
| `1.3.0` | Per-axis elasticity, merged `fillComponent` tiles, FLIP `animateSize` / `animatePosition` |

<!-- WHATSNEW:END -->

Full history in [CHANGELOG.md](./CHANGELOG.md).

## Install

```bash
bun add weighted-grid   # npm / pnpm / yarn all fine
```

## Quick start

One prop. That's the whole entry fee.

```tsx
import { Grid, GridItem } from "weighted-grid/react";

<Grid nrCols={7}>
  <GridItem weight={4}>hero</GridItem>
  <GridItem>a</GridItem>
  <GridItem>b</GridItem>
  <GridItem>c</GridItem>
</Grid>;
```

`weight` works like flexbox `flex`: _how much of the grid do I get_. Equal weights → equal
squares. No coordinates, no breakpoints, no math.

## The mental model

Three ideas, and you've seen the whole library.

**1 · Weight sizes both axes.** `weight={2}` is a 2×2 block. Pin one axis with `cols` or `rows`
and `weight` keeps driving the other:

```tsx
<GridItem weight={4}>elastic on both axes</GridItem>
<GridItem cols={3} weight={2}>3 columns wide, weight sets the height</GridItem>
<GridItem cols={2} rows={2}>strict — never stretches</GridItem>
```

Elasticity is **per axis**. Only pinning _both_ makes an item fully rigid.

**2 · Leftover space gets absorbed, fairly.** Elastic items `stretch` into the gaps around them,
split evenly between the neighbours flanking a gap — never all growth dumped on one side. Cap it
globally with `stretch={n}` on the `Grid`, or per item.

**3 · Whatever's left is yours.** Cells nothing could reach are merged into rectangular blocks and
handed to `fillComponent` — one node per block, not one per cell. Skip the prop and they stay empty.

```tsx
<Grid nrCols={12} stretch={2} fillComponent={(rect) => <Placeholder {...rect} />}>
  {items.map((item) => (
    <GridItem key={item.id}>{item.label}</GridItem>
  ))}
</Grid>
```

## API

### `<Grid>`

| Prop              | Type                         | Default    | What it does                                                                                                        |
| ----------------- | ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `nrCols`          | `number`                     | `7`        | Column count. Tracks scale with the container width.                                                                |
| `nrRows`          | `number`                     | —          | Minimum row tracks — a floor, not a cap. Omit it; the grid counts what its items need.                              |
| `gap`             | `number \| string`           | `8`        | Gutter between items (`px` if a number).                                                                            |
| `rowHeight`       | `"auto" \| number \| string` | `"auto"`   | `"auto"` splits the parent's height into bands (parent needs a height). A value = fixed rows, grid grows downward.   |
| `stretch`         | `number`                     | `Infinity` | How many extra cells an elastic axis may grow to absorb gaps. `0` turns it off.                                     |
| `fillComponent`   | `ReactNode \| (rect) => ReactNode` | —    | Rendered into the merged leftover blocks. Gets `{ row, col, rowSpan, colSpan }` when it's a function.                |
| `preset`          | `PresetFn`                   | —          | Auto-assigns props per item — see [Presets](#presets). Explicit `GridItem` props always win.                        |
| `showGrid`        | `boolean`                    | `false`    | Debug overlay drawn exactly on the real gutter, so guides can't drift from the actual layout.                        |
| `animateSize`     | `boolean`                    | `false`    | FLIP-transition an item's size when its span changes.                                                                |
| `animatePosition` | `boolean`                    | `false`    | Same, for position. Best for grids where items nudge rather than jump.                                               |
| `className`       | `string`                     | —          | On the outer container.                                                                                              |
| `style`           | `CSSProperties`              | —          | Merged into the outer container's inline style.                                                                      |

### `<GridItem>`

| Prop                   | Type     | Default | What it does                                                                       |
| ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `weight`               | `number` | `1`     | Relative size. Fills whichever axis isn't pinned; pin neither and it drives both.  |
| `cols`                 | `number` | —       | Exact column span. Pins the horizontal axis. Clamped to `nrCols`.                  |
| `rows`                 | `number` | —       | Exact row span. Pins the vertical axis.                                            |
| `stretch`              | `number` | —       | Overrides the grid's `stretch` for this item — including on a pinned axis.         |
| `stretchX` / `stretchY`| `number` | —       | Same, per axis.                                                                     |

> 💡 `stretch` on an item cuts both ways: let a `cols`-pinned card grow into a gap anyway, or stop
> one greedy elastic item from eating the whole row.

### Presets

A preset is just a function — `({ count, nrCols, nrRows }) => Partial<GridItemProps>[]` — that
hands each item its defaults. Perfect for "here are 40 cards, make it look intentional".

```tsx
import { masonPreset } from "weighted-grid/presets";

<Grid nrCols={8} preset={masonPreset()}>
  {items.map((item) => (
    <GridItem key={item.id}>{item.label}</GridItem>
  ))}
</Grid>;
```

- **`masonPreset(brick = 2)`** — running-bond brick rows, every other row offset by half a brick.
- **`organicPreset(seed = 1)`** — a drifting mosaic of small/medium/large tiles, scaled to `nrCols`.

They live on the `weighted-grid/presets` subpath, so a preset you don't import (and its code) never
reaches your bundle. Rolling your own is a ten-liner:

```tsx
import type { PresetFn } from "weighted-grid/presets";

const stripes: PresetFn = ({ count, nrCols }) =>
  Array.from({ length: count }, (_, i) => ({ weight: i % nrCols < nrCols / 2 ? 2 : 1 }));
```

Keep the function reference stable (module scope, or `useCallback`) — `Grid` memoizes on it.

### Responsive columns

There's no `wrap` prop, because there doesn't need to be one. Spans clamp to `nrCols`, so dropping
the column count at a breakpoint reflows everything into fewer columns and more rows, `flex-wrap`
style:

```tsx
<Grid nrCols={isMobile ? 2 : 6}>...</Grid>
```

That covers "3 cards on desktop, 1 on mobile" without an intrinsic-sizing allocator in the engine.

## Examples

Every one of these runs in the [live demo](https://jayf0x.github.io/weighted-grid/) — the source is
a few lines long and worth a skim.

| Example                                                                                                        | Shows off                                                              |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [prop-matrix](./demo/src/examples/prop-matrix/index.ts)                                                         | Every sizing prop side by side — the cheat sheet                       |
| [pinned-spans](./demo/src/examples/pinned-spans/index.ts)                                                       | Strict `cols`/`rows` items with elastic ones flowing around them       |
| [row-height](./demo/src/examples/row-height/index.tsx)                                                          | `"auto"` bands vs. fixed rows, with live controls                      |
| [modes](./demo/src/examples/modes/index.tsx)                                                                    | `masonPreset` and `organicPreset` on the same content                   |
| [organic-mosaic](./demo/src/examples/organic-mosaic/index.tsx)                                                  | 30 real cards, 48 columns, `stretch` + `fillComponent` doing the work  |

## Development

```bash
bun install
bun run test        # bun test
bun run typecheck
bun run build       # vite → dist/
bun run format      # biome check --write
bun run demo:dev    # the demo app in demo/
```

## License

[MIT](./LICENSE) © [jayF0x](https://github.com/jayf0x)
