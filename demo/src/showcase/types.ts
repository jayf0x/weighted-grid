import type { ComponentType } from 'react';

/** One case: a single idea, a live thing to play with, and (optionally) the plain-data
 * description of what it renders so a headless QA script can analyze it without a browser.
 *
 * Deliberately *not* a story: no args table, no variants, no decorators. A case is "here is the
 * core idea, here are two or three knobs, go play" — anything more belongs in the docs. */
export type Case = {
  /** Stable key — the anchor id and the index label's target. */
  id: string;
  /** Case title, set in the display face. */
  title: string;
  /** One sentence. The idea, not the API. */
  lede: string;
  /** The API surface this case is actually about, e.g. `['weight', 'nrCols']`. Rendered as the
   * case's spec chips and used by the index rail. */
  props?: readonly string[];
  Component: ComponentType;
};

/** Registry — an ordered list, not a map: case order is the reading order of the page and the
 * numbering on every badge, so it has to be explicit. */
export type CaseRegistry = readonly Case[];

/** 1-based position + total, threaded to whatever renders a "CASE 03/05" badge. */
export type CaseIndex = { index: number; total: number };
