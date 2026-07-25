import type { CaseMeta } from "@/lib/case";

/** Case header: name + the exact `Grid` props in effect, so the setup is readable without opening
 * the case file. */
export const Title = ({
  title,
  meta,
  tileCount,
}: {
  title: string;
  meta: CaseMeta;
  tileCount: number;
}) => (
  <h2 className="font-display text-lg mb-1">
    {title}{" "}
    <span className="font-mono text-xs opacity-60">
      ({tileCount} tiles,{" "}
      {Object.entries(meta)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")}
      )
    </span>
  </h2>
);
