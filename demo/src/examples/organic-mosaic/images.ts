// 10 static placeholder images pre-downloaded into demo/public/organic/ (see AGENTS.md's "demo/"
// section for the one-off curl command). Deterministic, no fetch, no runtime state — cycles the 10
// fixed filenames by tile index.
export const imageFor = (i: number) => `/organic/img-${i % 10}.jpg`;
