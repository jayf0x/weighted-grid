import { describe, expect, test } from 'bun:test';
import { masonPreset, organicPreset } from '../src/presets';

describe('masonPreset', () => {
  test('rows tile exactly to nrCols (even nrCols)', () => {
    const props = masonPreset()({ count: 12, nrCols: 8 });
    const rowsOf = (start: number, len: number) => props.slice(start, start + len);
    const sum = (row: ReturnType<typeof rowsOf>) => row.reduce((n, p) => n + (p.cols ?? 0), 0);
    expect(sum(rowsOf(0, 4))).toBe(8); // aligned row
    expect(sum(rowsOf(4, 5))).toBe(8); // offset row (extra half-brick at each end)
    expect(props.every((p) => p.rows === 1)).toBe(true);
  });

  test('offset row starts and ends with a half-brick', () => {
    const props = masonPreset()({ count: 9, nrCols: 8 });
    expect(props[4].cols).toBe(1);
    expect(props[8].cols).toBe(1);
  });

  test('truncates to the requested count', () => {
    expect(masonPreset()({ count: 3, nrCols: 8 })).toHaveLength(3);
  });

  test('brick size is configurable via the factory', () => {
    const props = masonPreset(4)({ count: 4, nrCols: 8 });
    expect(props[0].cols).toBe(4);
    expect(props[4]?.cols).toBeUndefined(); // only 4 items requested
  });
});

describe('organicPreset', () => {
  test('produces one entry per item, deterministic per seed', () => {
    const a = organicPreset(1)({ count: 20, nrCols: 48 });
    const b = organicPreset(1)({ count: 20, nrCols: 48 });
    expect(a).toHaveLength(20);
    expect(a).toEqual(b);
  });

  test('different seeds diverge', () => {
    const a = organicPreset(1)({ count: 20, nrCols: 48 });
    const b = organicPreset(2)({ count: 20, nrCols: 48 });
    expect(a).not.toEqual(b);
  });

  test('every pinned axis meets the nrCols-scaled minimum tier', () => {
    const props = organicPreset(7)({ count: 40, nrCols: 48 });
    const cardMin = Math.round((8 / 48) * 48);
    for (const { cols, rows } of props) {
      if (cols !== undefined) expect(cols).toBeGreaterThanOrEqual(cardMin);
      if (rows !== undefined) expect(rows).toBeGreaterThanOrEqual(cardMin);
    }
  });

  test('scales tiers down for a smaller nrCols', () => {
    const props = organicPreset(1)({ count: 10, nrCols: 12 });
    for (const { cols, rows } of props) {
      if (cols !== undefined) expect(cols).toBeLessThanOrEqual(12);
      if (rows !== undefined) expect(rows).toBeLessThanOrEqual(12);
    }
  });
});
