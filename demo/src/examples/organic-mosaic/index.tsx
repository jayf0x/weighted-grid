import { Grid, GridItem } from "weighted-grid/react";
import type { InfoMode } from "@/typing";
import { Filler } from "@/components/Filler";
import { generateOrganicTiles } from "./generator";
import { Card } from "./Card";

const SEED = 42;
const NR_COLS = 48;

const META = { nrCols: NR_COLS, rowHeight: 12, gap: 4, stretch: 8 } as const;
const TILES = generateOrganicTiles(SEED, 40, NR_COLS);

/** "Exotic Example" — real (well, real-looking) content, no controls, no QA labeling (seed/tile
 * count are implementation detail nobody browsing the demo cares about). Ported from dev's
 * `2-organic.ts` + `organic.ts` generator. Static — generated once at module scope, not per
 * render. Sized big — this is the "full fashion" showcase, last in the stacked shell. */
export function OrganicMosaicExample({ infoMode }: { infoMode: InfoMode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">
        Exotic Example
      </h2>
      <div className="h-[900px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
        <Grid
          {...META}
          fillComponent={(rect) => <Filler {...rect} />}
          className="h-full w-full"
        >
          {TILES.map((args, i) => (
            <GridItem key={i} {...args}>
              <Card index={i} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </section>
  );
}
