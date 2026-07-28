# Backlog

- **Non-React consumers.** `src/index.ts` only re-exports `Grid`/`GridItem` from `src/react.tsx`,
  and both that file and `src/utils.ts` import `react` directly (`Children`, `isValidElement`,
  JSX) — there's no framework-agnostic entry point, so installing `weighted-grid` without React
  fails at build/runtime. `react` was `peerDependenciesMeta.optional: true`, which was false; it's
  now a real `dependencies` entry (see [package.json](package.json)). To actually support
  non-React use: extract the placement engine (`spanFor`/`placeSpans`/`fillDeadZones`/
  `groupEmptyRects` in `src/utils.ts`) into a JSX-free `core` module that returns plain
  col/row/CSS data, and ship it as its own `weighted-grid/core` entry point — same idea as the old
  pre-simplify `src/core.ts` (see `AGENTS.md`'s "History" section, tag `pre-simplify-1.2.0`), but
  built from the current single-engine model instead of the removed squarified-treemap allocator.
