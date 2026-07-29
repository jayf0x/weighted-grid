import type { ComponentType } from 'react';

/** One plate: a single idea, a live thing to play with, and (optionally) the plain-data
 * description of what it renders so a headless QA script can analyze it without a browser.
 *
 * Deliberately *not* a story: no args table, no variants, no decorators. A plate is "here is the
 * core idea, here are two or three knobs, go play" — anything more belongs in the docs. */
export type Plate = {
  /** Stable key — the anchor id and the index label's target. */
  id: string;
  /** Plate title, set in the display face. */
  title: string;
  /** One sentence. The idea, not the API. */
  lede: string;
  /** The API surface this plate is actually about, e.g. `['weight', 'nrCols']`. Rendered as the
   * plate's spec chips and used by the index rail. */
  props?: readonly string[];
  Component: ComponentType;
};

/** Registry — an ordered list, not a map: plate order is the reading order of the page and the
 * numbering on every badge, so it has to be explicit. */
export type PlateRegistry = readonly Plate[];

/** 1-based position + total, threaded to whatever renders a "PLATE 03/06" badge. */
export type PlateIndex = { index: number; total: number };
