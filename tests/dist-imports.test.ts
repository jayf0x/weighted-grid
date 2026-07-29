import { describe, expect, test } from 'bun:test';

/**
 * Smoke-tests the actual published entry points (`dist/*.js`), not `src/*.ts` — this is what
 * catches a broken `exports` map, a missing build output, or an accidentally-bundled `react` that
 * the source-level tests never would (they import `src/` directly). Requires a build first; see
 * `pretest` in package.json.
 */
describe('dist entry points', () => {
  test('index exports Grid/GridItem', async () => {
    const mod = await import('../dist/index.js');
    expect(typeof mod.Grid).toBe('object'); // memo() component
    expect(typeof mod.GridItem).toBe('function');
  });

  test('react exports Grid/GridItem', async () => {
    const mod = await import('../dist/react.js');
    expect(typeof mod.Grid).toBe('object');
    expect(typeof mod.GridItem).toBe('function');
  });

  test('core exports the framework-agnostic engine, no react import', async () => {
    const mod = await import('../dist/core.js');
    expect(typeof mod.computeLayout).toBe('function');
    expect(typeof mod.spanFor).toBe('function');
    expect(typeof mod.placeSpans).toBe('function');

    const result = mod.computeLayout([{ weight: 1 }, { weight: 2 }], { nrCols: 4 });
    expect(result.placements.length).toBe(2);
  });

  test('presets exports masonPreset/organicPreset', async () => {
    const mod = await import('../dist/presets.js');
    expect(typeof mod.masonPreset).toBe('function');
    expect(typeof mod.organicPreset).toBe('function');
  });
});
