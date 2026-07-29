import { useMemo } from 'react';
import { Backdrop } from '@/showcase/Backdrop';
import { CaseProvider } from '@/showcase/Case';
import { GithubMark, NpmMark } from '@/showcase/icons';
import { Rail, useActiveCase } from '@/showcase/Rail';
import { ThemeToggle } from '@/showcase/theme';
import { cases, sourceOf } from '@/showcases';
import { Hero } from '@/showcases/Hero';
import pkg from '../../package.json';

/* ─────────────────────────────────────────────────────────────────────────────
   The sheet.

   Everything full-bleed is a hairline; everything readable sits in one measured
   column, flanked by the hatched margins the backdrop paints. The page is a set
   of numbered cases, and the only chrome is a top rule, a margin ruler, and a
   colour-scheme switch.
   ───────────────────────────────────────────────────────────────────────────── */

// 80rem — the backdrop anchors its hatched margins to half of this; keep the two in step.
const COLUMN = 'mx-auto w-full max-w-[80rem] px-6 sm:px-10';

const LINKS = [
  { href: 'https://www.npmjs.com/package/weighted-grid', label: 'npm', Icon: NpmMark },
  { href: 'https://github.com/jayf0x/weighted-grid', label: 'GitHub', Icon: GithubMark },
];

function TopBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-rule bg-[color-mix(in_oklab,var(--paper)_82%,transparent)] backdrop-blur-md">
      <div className={`${COLUMN} flex h-14 items-center justify-between`}>
        <a href="#top" className="group flex items-baseline gap-2.5">
          <span className="font-display text-[17px] font-semibold tracking-[-0.01em] whitespace-nowrap">
            weighted-grid
          </span>
          <span className="spec hidden transition-colors group-hover:text-ink-2 sm:inline">v{pkg.version}</span>
        </a>

        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              title={label}
              className="p-1.5 text-ink-3 transition-colors hover:text-ink"
            >
              <Icon className="size-4" />
              <span className="sr-only">{label}</span>
            </a>
          ))}
          <span className="mx-2 h-4 w-px bg-rule" />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const ids = useMemo(() => cases.map((c) => c.id), []);
  const active = useActiveCase(ids);

  return (
    <>
      <Backdrop />
      <TopBar />
      <Rail cases={cases} active={active} />

      <main id="top" className={COLUMN}>
        <Hero version={pkg.version} />

        {cases.map((def, i) => {
          const { Component } = def;
          return (
            <CaseProvider
              key={def.id}
              value={{ def, at: { index: i + 1, total: cases.length }, source: sourceOf(def.id) }}
            >
              <Component />
            </CaseProvider>
          );
        })}

        <footer className="line-t flex flex-wrap items-baseline justify-between gap-6 py-14">
          <p className="spec">MIT · jayf0x</p>
          <p className="spec">v{pkg.version}</p>
        </footer>
      </main>
    </>
  );
}
