import type { InfoMode } from '@/components/Item';

export function Header({
  infoMode,
  setInfoMode,
}: {
  infoMode: InfoMode;
  setInfoMode: (mode: InfoMode) => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-7">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-[26px] font-medium tracking-tight text-ink">weighted-grid</h1>
        <span className="text-[13px] text-ink/35">weighted grid for React</span>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-[13px] text-ink/60">
          <input
            type="checkbox"
            checked={infoMode === 'dev'}
            onChange={(e) => setInfoMode(e.currentTarget.checked ? 'dev' : 'simple')}
          />
          dev info
        </label>
        <a
          className="text-[13px] text-ink/50 transition-colors hover:text-ink"
          href="https://github.com/jayf0x/weighted-grid"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </div>
    </header>
  );
}
