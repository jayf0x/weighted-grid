import { useEffect } from "react";
import { Grid, GridItem } from "weighted-grid/react";

const CARDS = [
  { weight: 1 },
  { weight: 2 },
  { weight: 3 },
  { weight: 4 },
  // fixed cols
  { weight: 1, cols: 1 },
  { weight: 2, cols: 1 },
  { weight: 3, cols: 2 },
  { weight: 4, cols: 2 },
  // fixed rows
  { weight: 1, rows: 1 },
  { weight: 2, rows: 1 },
  { weight: 3, rows: 2 },
  { weight: 4, rows: 2 },
  // foxed cols and rows. Weight should not have any effect
  { weight: 10, cols: 1, rows: 1 },
  { weight: 20, cols: 1, rows: 1 },
  { weight: 30, cols: 2, rows: 2 },
  { weight: 40, cols: 2, rows: 2 },
  // could be largest, depending on others
  { weight: 4 },
  // should be largest
  { cols: 5, rows: 5 },
];

export const App = () => {
  const nrCols = 8;

  return (
    <section className="mx-auto w-[600px] h-[600px] m-5">
      <p id="global_stats">
        <p>nrCards: {CARDS.length}</p>
      </p>
      <Grid
        cols={nrCols}
        rows={nrCols}
        showGrid
        stretch={0}
        fillComponent={
          <div className="bg-[#f43e] w-full h-full" id="filler">
            .
          </div>
        }
      >
        {CARDS.map((args, i) => (
          <GridItem key={i} {...args}>
            <div className="bg-[#35ee] w-full h-full text-xs" id="item">
              <span id="index">{i}</span>
              <span id="index" id="args">
                {JSON.stringify(args)}
              </span>
            </div>
          </GridItem>
        ))}
      </Grid>
    </section>
  );
};
