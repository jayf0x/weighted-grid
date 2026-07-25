import { Grid, GridItem } from "weighted-grid/react";
import { generateOrganicTiles } from "./organic.js";

const SEED = 42;
const NR_COLS = 30;

const tiles = generateOrganicTiles(SEED, 20);

export default () => {
  return (
    <section className="mx-auto w-[900px] m-5">
      <p>
        organic mosaic — seed {SEED}, {tiles.length} tiles
      </p>
      <Grid
        nrCols={NR_COLS}
        rowHeight={16}
        gap={4}
        stretch={8}
        fillComponent={<div className="bg-fill w-full h-full" id="filler" />}
      >
        {tiles.map((tile, i) =>
          tile.kind === "void" ? (
            <GridItem
              key={i}
              cols={tile.cols}
              rows={tile.rows}
              weight={tile.weight}
            >
              <div className="bg-void w-full h-full" id="void" />
            </GridItem>
          ) : (
            <GridItem
              key={i}
              cols={tile.cols}
              rows={tile.rows}
              weight={tile.weight}
            >
              <div className="bg-item w-full h-full text-[0.6rem] flex items-center justify-center">
                {i}
              </div>
            </GridItem>
          ),
        )}
      </Grid>
    </section>
  );
};
