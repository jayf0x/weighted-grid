import { Grid, GridItem } from "weighted-grid/react";
import { organicPreset } from "weighted-grid/presets";
import type { InfoMode } from "@/typing";
import { Filler } from "@/components/Filler";
import { Card } from "./Card";
import { useIsMobile } from "@/utils/hooks";
import { useCallback } from "react";

const TILE_COUNT = 30;

/** "Exotic Example" — real-looking card content, last in the stacked shell. */
export function OrganicMosaicExample({ infoMode }: { infoMode: InfoMode }) {
  const isMobile = useIsMobile();

  // Stable across re-renders so Grid's preset memo doesn't recompute every render.
  const preset = useCallback(organicPreset({ seed: 42 }), []);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">
        Exotic Example
      </h2>
      <div className="h-[900px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
        <Grid
          nrCols={isMobile ? 20 : 48}
          rowHeight={8}
          // gap={4}
          // stretch={8}
          preset={preset}
          fillComponent={(rect) => (
            <Filler
              {...rect}
              // className="bg-cover bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmZhYXlhem94dzdyaThtejRxZ2tqMDAwMW9keDk5NmI5Z2V4Z3pncCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hl3NjtLaPUM1RBt45y/giphy.gif')]"
            />
          )}
          className="h-full w-full"
        >
          {Array.from({ length: TILE_COUNT }, (_, i) => (
            <GridItem key={i} stretch={10}>
              <Card index={i} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </section>
  );
}
