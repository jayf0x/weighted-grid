// 10 static placeholder images pre-downloaded into demo/public/organic/ (see AGENTS.md's "demo/"
// section for the one-off curl command). Deterministic, no fetch, no runtime state — cycles the 10
// fixed filenames by tile index.
export const imageFor = (i: number) => `/organic/img-${i % 10}.jpg`;

export const Card = ({ index }: { index: number }) => (
  <div className="group relative h-full w-full overflow-hidden rounded-md border border-black/[0.04] bg-panel">
    <img
      src={imageFor(index)}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1.5">
      <span className="font-mono text-[10px] text-white/90">card {index}</span>
    </div>
  </div>
);
