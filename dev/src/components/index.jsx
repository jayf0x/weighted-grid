import { Grid, GridItem } from "weighted-grid/react";

export const FillComponent = () => (
  <div className="bg-fill w-full h-full" id="filler" />
);

export const Void = (...args) => (
  <GridItem {...args}>
    <div className="bg-void w-full h-full" id="void" />
  </GridItem>
);

export const Item = (index, ...args) => (
  <GridItem {...args}>
    <div className="bg-item w-full h-full text-[0.6rem]" id="item">
      <span id="index">{index}) </span>
      <span id="args">
        {Object.entries(args)
          .map(([k, v]) => k.slice(0, 1) + ": " + v)
          .join(", ")}
      </span>
    </div>
  </GridItem>
);

export const Title = (args = {}) => (
  <h2>
    Title:{" "}
    {Object.entries(args)
      .map(([k, v]) => k + ": " + v)
      .join(", ")}
  </h2>
);
