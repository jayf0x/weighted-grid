import { useEffect, useState } from "react";
import { Grid, GridItem } from "weighted-grid/react";
import { CaseFrame } from "@/showcase/Case";
import { range, segment, useControls } from "@/showcase/controls";
import type { Case } from "@/showcase/types";
import { Tile } from "../tiles";

/* Four tiles, two sliding dividers. The layout is a pure function of one clock:
 *
 *     70 | 30            50 | 50
 *     ---+---   becomes  ---+---
 *     30 | 70            80 | 20
 *
 * which is the smallest layout change that is unambiguously *movement* — every tile grows on one
 * axis and shrinks on the other, and each one moves. That's what makes it a fair test of an easing
 * curve: with 30 tiles you'd be judging the crowd, not the curve. */

const N = 12; // the grid is N×N cells, so a split is a whole number of cells
const AMP = 0.28; // keep each step well inside the library's own snap threshold (FLIP_MAX_SCALE)
const STEP_MS = 2000;
const STEP_RAD = 0.7;

/** Straight from easingwizard.com — the site's Tailwind output with the underscores unpacked. */
const EASINGS = {
  glide:
    "linear(0,0.013 1%,0.051 2.2%,0.404 9.8%,0.51 12.6%,0.602 15.5%,0.683 18.7%,0.754 22.2%,0.813 26%,0.861 30.2%,0.9 34.8%,0.931 40%,0.972 52.7%,0.992 70.2%,1)",
  anticipate: "cubic-bezier(0.8,-0.4,0.5,1)",
  elastic:
    "linear(0,0.029 1.3%,0.119 2.8%,0.659 8.7%,0.871 11.6%,1.009 14.6%,1.052 16.2%,1.078 17.9%,1.088 19.7%,1.085 21.7%,1.014 31.4%,0.993 38%,1.001 57.6%,1)",
  overshoot:
    "linear(0,0.49 7.4%,0.864 15.3%,1.005 19.4%,1.12 23.7%,1.206 28.1%,1.267 32.8%,1.296 36.4%,1.311 40.2%,1.313 44.2%,1.301 48.6%,1.252 56.9%,1.105 74.4%,1.048 82.5%,1.011 91.1%,1)",
  // smooth:
  //   "linear(0,0.49_7.4%,0.864_15.3%,1.005_19.4%,1.12_23.7%,1.206_28.1%,1.267_32.8%,1.296_36.4%,1.311_40.2%,1.313_44.2%,1.301_48.6%,1.252_56.9%,1.105_74.4%,1.048_82.5%,1.011_91.1%,1)",
  // default: "",
} as const;

const SCHEMA = {
  easing: segment(
    "easing",
    "glide",
    Object.keys(EASINGS) as (keyof typeof EASINGS)[],
  ),
  ms: range("duration", 900, { min: 150, max: 2000, step: 50, unit: "ms" }),
};

/** A split position in [0,1] as a whole number of cells, never collapsing a side to nothing. */
const splitAt = (f: number) => Math.min(N - 2, Math.max(2, Math.round(f * N)));

function Animation() {
  const { values, panel } = useControls(SCHEMA);
  const [t, setT] = useState(0);
  const step = () => setT((v) => v + STEP_RAD);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setT((v) => v + STEP_RAD);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  const rowSplit = splitAt(0.5 + AMP * Math.cos(t));
  // the two vertical dividers drift independently, so the four tiles never line up into a plain
  // 2×2 — the top pair and the bottom pair are cut at different columns
  const topSplit = splitAt(0.5 + AMP * Math.sin(t));
  const bottomSplit = splitAt(0.5 + AMP * Math.sin(t * 0.7 + 1.4));

  const quads = [
    { cols: topSplit, rows: rowSplit },
    { cols: N - topSplit, rows: rowSplit },
    { cols: bottomSplit, rows: N - rowSplit },
    { cols: N - bottomSplit, rows: N - rowSplit },
  ];

  return (
    <CaseFrame
      controls={
        <>
          {panel}
          <button
            type="button"
            onClick={step}
            className="spec mt-4 w-full cursor-pointer border border-rule bg-raised py-2 text-accent transition-colors hover:border-accent"
          >
            advance now
          </button>
          <p className="mt-4 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-3">
            The dividers move every 2s on their own. Curves are copied out of{" "}
            <a
              href="https://easingwizard.com/"
              target="_blank"
              rel="noreferrer"
              className="border-b border-accent/50 text-accent hover:opacity-70"
            >
              easingwizard.com
            </a>
            , which is where the CSS <code className="font-mono">linear()</code>{" "}
            ones came from.
          </p>
        </>
      }
    >
      <div className="h-full">
        <Grid
          nrCols={N}
          nrRows={N}
          gap={6}
          animateSize
          animatePosition
          itemAnimation={`${values.ms}ms ${EASINGS[values.easing]}`}
        >
          {quads.map((q, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: four fixed quadrants — the index *is* the identity
            <GridItem key={i} cols={q.cols} rows={q.rows}>
              <Tile n={i + 1} label={`${q.cols} × ${q.rows}`} />
            </GridItem>
          ))}
        </Grid>
      </div>
    </CaseFrame>
  );
}

export const showcase: Case = {
  id: "animation",
  title: "Animation",
  lede: "Grid spans are integers: they jump, they do not interpolate. animateSize/animatePosition measure each item before and after a re-layout and play the difference back as a transform, and itemAnimation is the CSS transition value that does it — any duration, any curve, including linear().",
  props: ["animateSize", "animatePosition", "itemAnimation"],
  Component: Animation,
};
