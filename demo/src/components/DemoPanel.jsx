import { Grid, GridItem } from 'weighted-grid/react';
import { Block } from './Block.jsx';

const FillerTile = () => (
  <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-black/10 text-[10px] text-ink/25">
    fillComponent
  </div>
);

/** One labeled Grid instance. Pass `rowHeight` ("auto" or a px number) to switch between the two
 * vertical flows the library offers — the caption below always explains what that does here. */
export function DemoPanel({ title, caption, blocks, nrCols, rowHeight, gap, stretch, showGrid, fillGaps }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">{title}</h2>
      <div
        className="h-[380px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5"
        style={{ resize: rowHeight === 'auto' ? 'vertical' : 'none' }}
      >
        <Grid
          nrCols={nrCols}
          gap={gap}
          rowHeight={rowHeight}
          stretch={stretch}
          showGrid={showGrid}
          fillComponent={fillGaps ? <FillerTile /> : undefined}
          className="h-full w-full"
        >
          {blocks.map((b) => (
            <GridItem key={b.i} weight={b.weight}>
              <Block i={b.i} weight={b.weight} label={b.label} />
            </GridItem>
          ))}
        </Grid>
      </div>
      <p className="text-[13px] leading-relaxed text-ink/40">{caption}</p>
    </section>
  );
}
