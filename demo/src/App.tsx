import { useMemo } from 'react';
import { Backdrop } from '@/showcase/Backdrop';
import { PlateProvider } from '@/showcase/Plate';
import { Rail, useActivePlate } from '@/showcase/Rail';
import { ThemeToggle } from '@/showcase/theme';
import { plates, sourceOf } from '@/showcases';
import { Hero } from '@/showcases/Hero';
import pkg from '../../package.json';

/* ─────────────────────────────────────────────────────────────────────────────
   The sheet.

   Everything full-bleed is a hairline; everything readable sits in one measured
   column. The page is a set of numbered plates, and the only chrome is a top
   rule, a margin ruler, and a colour-scheme switch.
   ───────────────────────────────────────────────────────────────────────────── */

const COLUMN = 'mx-auto w-full max-w-[80rem] px-6 sm:px-10';

function TopBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-rule bg-[color-mix(in_oklab,var(--paper)_82%,transparent)] backdrop-blur-md">
      <div className={`${COLUMN} flex h-14 items-center justify-between`}>
        <a href="#top" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[17px] tracking-[-0.01em] whitespace-nowrap">weighted-grid</span>
          <span className="spec hidden transition-colors group-hover:text-ink-2 sm:inline">v{pkg.version}</span>
        </a>
        <div className="flex items-center gap-4 sm:gap-5">
          <a
            href="https://www.npmjs.com/package/weighted-grid"
            target="_blank"
            rel="noreferrer"
            className="spec hidden transition-colors hover:text-ink sm:inline"
          >
            npm
          </a>
          <a
            href="https://github.com/jayf0x/weighted-grid"
            target="_blank"
            rel="noreferrer"
            className="spec hidden transition-colors hover:text-ink sm:inline"
          >
            github
          </a>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="line-t py-14">
      <div className="flex flex-wrap items-baseline justify-between gap-6">
        <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-3">
          Six plates, one engine. The placement core ships separately as{' '}
          <code className="font-mono text-ink-2">weighted-grid/core</code> — framework-agnostic, no React import — with
          this page as the one renderer that happens to exist.
        </p>
        <p className="spec">MIT · jayf0x</p>
      </div>
    </footer>
  );
}

export default function App() {
  const ids = useMemo(() => plates.map((p) => p.id), []);
  const active = useActivePlate(ids);

  return (
    <>
      <Backdrop />
      <TopBar />
      <Rail plates={plates} active={active} />

      <main id="top" className={COLUMN}>
        <Hero version={pkg.version} />

        {plates.map((def, i) => {
          const { Component } = def;
          return (
            <PlateProvider
              key={def.id}
              value={{ def, at: { index: i + 1, total: plates.length }, source: sourceOf(def.id) }}
            >
              <Component />
            </PlateProvider>
          );
        })}

        <Footer />
      </main>
    </>
  );
}
