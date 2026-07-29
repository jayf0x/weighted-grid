import { useEffect, useState } from 'react';

export type Theme = 'light' | 'system' | 'dark';

declare global {
  interface Window {
    /** Defined inline in `index.html` so the theme is painted before first paint. Single writer
     * for both the root class and localStorage — React only calls it. */
    _setTheme: (theme: Theme | null) => void;
  }
}

const read = (): Theme => {
  const c = document.documentElement.classList;
  return c.contains('dark') ? 'dark' : c.contains('light') ? 'light' : 'system';
};

/** Whether the page is currently *rendering* dark, resolving `system` against the OS — for the few
 * places that need the real value (canvas colours, image treatment), not for styling. */
export function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      const t = read();
      setDark(t === 'dark' || (t === 'system' && mq.matches));
    };
    sync();
    mq.addEventListener('change', sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => {
      mq.removeEventListener('change', sync);
      obs.disconnect();
    };
  }, []);
  return dark;
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'day' },
  { value: 'system', label: 'auto' },
  { value: 'dark', label: 'night' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => setTheme(read()), []);

  return (
    // real radios, visually hidden: the roving-focus and arrow-key behaviour of a radiogroup is
    // free from the platform, and re-implementing it on buttons is how that behaviour gets lost
    <fieldset className="flex gap-px bg-rule p-px">
      <legend className="sr-only">Colour scheme</legend>
      {OPTIONS.map((o) => {
        const active = theme === o.value;
        return (
          <label
            key={o.value}
            className={
              'spec cursor-pointer px-2 py-1.5 transition-colors duration-150 has-focus-visible:outline has-focus-visible:outline-accent ' +
              (active ? 'bg-accent text-paper' : 'bg-paper text-ink-3 hover:text-ink')
            }
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={active}
              onChange={() => {
                window._setTheme(o.value);
                setTheme(o.value);
              }}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </fieldset>
  );
}
