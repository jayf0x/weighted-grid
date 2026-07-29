import { Grid, GridItem, type GridProps } from 'weighted-grid/react';
import { FLIP_TRANSITION } from '@/showcase/motion';
import type { ReportCase } from './report';
import { Tile, Void } from './tiles';

/** Renders a plain-data case. One renderer for every `ReportCase`, so a data case can never grow
 * bespoke markup that the QA script doesn't know about. */
export function DataGrid({ data, ...overrides }: { data: ReportCase } & Omit<GridProps, 'children'>) {
  // same rule as the other cases: no caption in a cell too small to hold one
  const hasLabels = typeof overrides.rowHeight !== 'number' || overrides.rowHeight >= 44;
  return (
    <Grid animateSize itemAnimation={FLIP_TRANSITION} {...data.meta} {...overrides}>
      {data.tiles.map((tile, i) => {
        const { kind = 'item', ...item } = tile;
        const spec = [
          item.cols !== undefined && `${item.cols}c`,
          item.rows !== undefined && `${item.rows}r`,
          item.cols === undefined || item.rows === undefined ? `w${item.weight ?? 1}` : null,
        ]
          .filter(Boolean)
          .join(' ');
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: tiles are a fixed, ordered dataset
          <GridItem key={i} {...item}>
            {kind === 'void' ? (
              <Void />
            ) : (
              <Tile n={i} label={hasLabels ? spec : undefined} accent={i === data.tiles.length - 1} />
            )}
          </GridItem>
        );
      })}
    </Grid>
  );
}
