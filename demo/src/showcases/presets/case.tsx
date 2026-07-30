import { useMemo, useRef } from "react";
import { masonPreset, organicPreset } from "weighted-grid/presets";
import { Grid, GridItem } from "weighted-grid/react";
import { CaseFrame } from "@/showcase/Case";
import { range, segment, useControls, when } from "@/showcase/controls";
import { useSquareRows } from "@/showcase/hooks";
import { DEMO_ITEM_ANIMATION } from "@/showcase/motion";
import type { Case } from "@/showcase/types";
import { Tile, Void } from "../tiles";

// Fixed, not knobs: `nrCols`/`count`/`gap` are case 01's subject, and repeating them here would
// bury the one dial that actually belongs to the preset.
const NR_COLS = 20;
const COUNT = 34;
const GAP = 6;

const isOrganic = (v: Record<string, unknown>) => v.preset === "organic";

const SCHEMA = {
  preset: segment("preset", "organic", ["organic", "mason"] as const),
  // one knob per preset, and only ever the one that does something: `seed` means nothing to a brick
  // bond, `brick` means nothing to a noise field. A slider that moves and changes nothing is worse
  // than no slider.
  seed: when(range("seed", 3, { min: 1, max: 12 }), isOrganic),
  brick: when(
    range("brick", 4, { min: 2, max: 6, step: 2 }),
    (v) => !isOrganic(v),
  ),
};

/** Every tile below is `<GridItem>` with no props at all — the preset writes them. */
function Presets() {
  const { values, panel } = useControls(SCHEMA);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowHeight = useSquareRows(stageRef, NR_COLS, GAP);

  // memoised because `<Grid>` re-runs the preset whenever the function identity changes
  const preset = useMemo(
    () =>
      values.preset === "organic"
        ? organicPreset({ seed: values.seed })
        : masonPreset({ brick: values.brick }),
    [values.preset, values.seed, values.brick],
  );

  return (
    <CaseFrame controls={panel}>
      <div ref={stageRef}>
        <Grid
          nrCols={NR_COLS}
          gap={GAP}
          rowHeight={values.preset == "mason" ? rowHeight : undefined}
          preset={preset}
          // animateSize
          itemAnimation={DEMO_ITEM_ANIMATION}
          stretch={10}
          fillComponent={<Void />}
        >
          {Array.from({ length: COUNT }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: specimen tiles are positional — the index *is* the identity
            <GridItem key={i}>
              <Tile n={i} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: "presets",
  title: "Presets",
  lede: "A preset is a function that writes weight/cols/rows per item, so a grid can size itself: organic drifts through size tiers off seeded noise, mason lays a running-bond brick. Props set on a GridItem still win.",
  props: ["preset", "organicPreset", "masonPreset"],
  Component: Presets,
};
