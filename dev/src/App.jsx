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
  return (
    <section className="mx-auto w-[900px] h-[600px] m-5">
      <p id="global_stats">
        <p>nrCards: {CARDS.length}</p>
      </p>
      <Grid
        nrCols={10}
        // nrRows={160}
        // showGrid
        stretch={4}
        fillComponent={
          <div className="bg-[#f439] w-full h-full" id="filler">
            _
          </div>
        }
        gap={0}
        // className="bg-amber-300"
      >
        {CARDS.map((args, i) => (
          <GridItem key={i} {...args}>
            <div className="bg-[#35e9] w-full h-full text-[0.6rem]" id="item">
              <span id="index">{i}) </span>
              <span id="args">
                {Object.entries(args)
                  .map(([k, v]) => k.slice(0, 1) + ": " + v)
                  .join(", ")}
              </span>
            </div>
          </GridItem>
        ))}
      </Grid>
    </section>
  );
};
