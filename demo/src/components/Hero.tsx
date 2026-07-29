/** The page's one first-impression beat — a headline + the smallest possible working snippet,
 * directly above the example rail. Everything below this is proof; this is the pitch. */
export function Hero() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-8 pb-10 pt-2">
      <div className="flex flex-col gap-5 md:max-w-2xl">
        <h2 className="font-display text-[38px] font-medium leading-[1.05] tracking-tight text-ink md:text-[46px]">
          A CSS grid that <span className="text-accent">fills itself in.</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-ink/55">
          One component, one placement engine. Give each tile a <code className="font-mono text-ink/75">weight</code>,
          pin a <code className="font-mono text-ink/75">cols</code>/<code className="font-mono text-ink/75">rows</code>{' '}
          axis or don't — the rest of the grid stretches and packs around whatever you left elastic. No
          layout mode to pick, no manual breakpoints to hand-author.
        </p>
      </div>
      <pre className="mt-6 w-fit rounded-lg border border-line bg-ink px-4 py-3 font-mono text-[12px] leading-relaxed text-white/85">
        {'<Grid nrCols={8}>\n'}
        {'  <GridItem weight={2}>…</GridItem>\n'}
        {'  <GridItem cols={2} rows={2}>…</GridItem>\n'}
        {'</Grid>'}
      </pre>
    </div>
  );
}
