import type { Case } from "../lib/case";
import { generateOrganicTiles } from "./organic";

const SEED = 42;

export const organicCase: Case = {
  title: `organic mosaic — seed ${SEED}`,
  meta: { nrCols: 48, rowHeight: 12, gap: 4, stretch: 8 },
  tiles: generateOrganicTiles(SEED, 40),
};
