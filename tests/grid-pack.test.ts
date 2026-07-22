import { describe, expect, test } from 'bun:test';
import { type GridInput, packGrid } from '../src/grid-pack';

/**
 * Validates a packing against the hard invariants a grid packer must never violate:
 * every cell covered exactly once (no overlap, no gap), every span positive and in-bounds,
 * every item present. Returns a human-readable failure or null.
 */
const validate = (items: GridInput[], cols: number, rows: number): string | null => {
  const placed = packGrid(items, { cols, rows });
  if (placed.length !== items.length) return `expected ${items.length} placements, got ${placed.length}`;

  const gridRows = Math.max(rows, Math.ceil(items.length / cols));
  const grid: (string | number | null)[][] = Array.from({ length: gridRows }, () => new Array(cols).fill(null));

  for (const p of placed) {
    if (p == null) return 'undefined placement (item dropped)';
    if (p.colSpan < 1 || p.rowSpan < 1) return `non-positive span at id ${p.id}: ${p.colSpan}x${p.rowSpan}`;
    if (p.col < 0 || p.row < 0 || p.col + p.colSpan > cols || p.row + p.rowSpan > gridRows) {
      return `out of bounds id ${p.id}: col ${p.col}+${p.colSpan}/${cols}, row ${p.row}+${p.rowSpan}/${gridRows}`;
    }
    for (let y = p.row; y < p.row + p.rowSpan; y++) {
      for (let x = p.col; x < p.col + p.colSpan; x++) {
        if (grid[y][x] !== null) return `OVERLAP at ${x},${y}: id ${grid[y][x]} and id ${p.id}`;
        grid[y][x] = p.id;
      }
    }
  }

  for (let y = 0; y < gridRows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === null) return `GAP at ${x},${y}`;
    }
  }
  return null;
};

const equalItems = (n: number): GridInput[] => Array.from({ length: n }, (_, i) => ({ id: i }));

describe('packGrid invariants', () => {
  test('single item fills the grid', () => {
    expect(validate([{ id: 0 }], 7, 7)).toBeNull();
  });

  test('equal-weight counts fill exactly, no overlap', () => {
    for (const n of [1, 2, 3, 5, 7, 8, 13, 20, 22, 40, 50, 60, 100]) {
      expect(validate(equalItems(n), 7, 7)).toBeNull();
    }
  });

  // The reported bug: many items with few columns.
  test('reported overlap cases: high count / low cols', () => {
    const cases: [number, number, number][] = [
      [60, 4, 7],
      [60, 2, 7],
      [20, 4, 7],
      [60, 12, 7],
      [60, 3, 7],
      [30, 2, 5],
    ];
    for (const [n, cols, rows] of cases) {
      expect(validate(equalItems(n), cols, rows)).toBeNull();
    }
  });

  test('exhaustive small sweep (equal weights)', () => {
    for (let cols = 1; cols <= 12; cols++) {
      for (let rows = 1; rows <= 12; rows++) {
        for (let n = 1; n <= 40; n++) {
          const err = validate(equalItems(n), cols, rows);
          expect(err, `n=${n} cols=${cols} rows=${rows}: ${err}`).toBeNull();
        }
      }
    }
  });

  test('mixed weights never overlap', () => {
    const mk = (n: number): GridInput[] =>
      Array.from({ length: n }, (_, i) => ({ id: i, weight: i === 0 ? 8 : (i % 5) + 1 }));
    for (let cols = 1; cols <= 12; cols++) {
      for (const n of [3, 5, 10, 20, 40, 60]) {
        const err = validate(mk(n), cols, 7);
        expect(err, `n=${n} cols=${cols}: ${err}`).toBeNull();
      }
    }
  });

  test('extreme weight skew (one giant, many tiny)', () => {
    const items: GridInput[] = [{ id: 'big', weight: 1000 }, ...equalItems(30).map((it) => ({ ...it, weight: 0.01 }))];
    expect(validate(items, 6, 6)).toBeNull();
  });

  test('output order matches input order', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const placed = packGrid(items, { cols: 3, rows: 1 });
    expect(placed.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});
