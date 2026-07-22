/**
 * `@rect-pack/react` — thin React wrapper over {@link ./grid-pack}.
 *
 * The core computes cell spans; CSS Grid does everything else. Container resize is handled by the
 * browser (`1fr` tracks), so there is no re-pack on resize — the component only re-packs when the
 * set of items or their weights change.
 *
 * `react` is a peer dependency (not bundled) so this stays tree-shakeable and framework-neutral.
 */
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useMemo,
} from 'react';
import { packGrid } from './grid-pack';

/** Turns a size hint into a relative weight. Fixed px sizes just mean "wants more cells". */
const toWeight = (props: GridItemProps): number => {
  if (typeof props.weight === 'number') return props.weight;
  // ponytail: px hints resolved to a weight, not a hard size — matches the soft-grid model.
  // Area of the hint (in px^2) relative to a nominal 160px cell reads as "how many cells".
  const px = (v: GridItemProps['width']): number | null =>
    typeof v === 'number' ? v : typeof v === 'string' && v.endsWith('px') ? Number.parseFloat(v) : null;
  const w = px(props.width);
  const h = px(props.height);
  if (w == null && h == null) return 1;
  const side = 160;
  return Math.max(0.25, ((w ?? side) * (h ?? side)) / (side * side));
};

export type GridItemProps = {
  children?: ReactNode;
  /** Explicit relative area. Overrides width/height hints. */
  weight?: number;
  /** Size hint (px number or `"200px"`); resolved to a weight, not pinned exactly. */
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};

/** Marker component — GridPack reads its props; it renders its children in an assigned cell block. */
export const GridItem = (_: GridItemProps): null => null;

export type GridPackProps = {
  children?: ReactNode;
  cols?: number;
  rows?: number;
  gap?: number | string;
  showGrid?: boolean;
  className?: string;
  style?: CSSProperties;
};

export const GridPack = ({
  children,
  cols = 7,
  rows = 7,
  gap = 8,
  showGrid = false,
  className,
  style,
}: GridPackProps) => {
  const items = Children.toArray(children).filter(isValidElement) as React.ReactElement<GridItemProps>[];

  const placements = useMemo(
    () =>
      packGrid(
        items.map((child, i) => ({ id: i, weight: toWeight(child.props) })),
        { cols, rows },
      ),
    // Weights + count drive the layout; re-pack only when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((c) => toWeight(c.props)).join(','), cols, rows],
  );

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoRows: '1fr',
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    ...(showGrid
      ? { backgroundSize: `calc(100% / ${cols}) 100%`, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)' }
      : {}),
    ...style,
  };

  return (
    <div className={className} style={gridStyle}>
      {placements.map((p, i) => (
        <div
          key={p.id}
          style={{
            gridColumn: `${p.col + 1} / span ${p.colSpan}`,
            gridRow: `${p.row + 1} / span ${p.rowSpan}`,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {items[i].props.children}
        </div>
      ))}
    </div>
  );
};
