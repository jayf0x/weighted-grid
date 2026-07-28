import type { GridItemProps } from '../react';

export type PartialGridItem = Partial<GridItemProps>;

export type PresetArgs = { count: number; nrCols: number; nrRows?: number };

export type PresetFn = (args: PresetArgs) => PartialGridItem[];

export type PresetFactory<T> = (options?: T, itemDefaults?: PartialGridItem) => PresetFn;
