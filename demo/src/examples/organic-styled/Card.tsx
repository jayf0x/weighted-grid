// 10 static placeholder images pre-downloaded into demo/public/organic/ (see AGENTS.md's "demo/"
// section for the one-off curl command). Deterministic, no fetch, no runtime state — cycles the 10
// fixed filenames by tile index.
export const imageFor = (i: number) => `${import.meta.env.BASE_URL}organic/img-${i % 10}.jpg`;

// Short placeholder copy, cycled by index — not real captions, just enough text to show the layout
// carries real content (headline + tag), not just a number.
const HEADLINES = [
  'Lorem ipsum dolor sit',
  'Consectetur adipiscing elit',
  'Sed do eiusmod tempor',
  'Ut enim ad minim veniam',
  'Duis aute irure dolor',
  'Excepteur sint occaecat',
  'Culpa qui officia',
  'Deserunt mollit anim',
];
const TAGS = ['field notes', 'studio', 'archive', 'process', 'material', 'in progress'];

export const Card = ({ index }: { index: number }) => (
  <div className="group relative h-full w-full overflow-hidden rounded-md border border-black/[0.04] bg-panel">
    <img
      src={imageFor(index)}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90" />
    <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink/70 backdrop-blur-sm">
      {TAGS[index % TAGS.length]}
    </span>
    <div className="absolute inset-x-0 bottom-0 px-2.5 py-2">
      <p className="font-display text-[13px] leading-snug text-white">{HEADLINES[index % HEADLINES.length]}</p>
      <span className="font-mono text-[9px] text-white/60">card {index}</span>
    </div>
  </div>
);
