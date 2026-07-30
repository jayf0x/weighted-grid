import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HslaColorPicker, RgbColor, RgbColorPicker } from "react-colorful";
import { Popover } from "react-tiny-popover";

export type Theme = "light" | "system" | "dark";

declare global {
  interface Window {
    /** Defined inline in `index.html` so the theme is painted before first paint. Single writer
     * for both the root class and localStorage — React only calls it. */
    _setTheme: (theme: Theme | null) => void;
  }
}

const read = (): Theme => {
  const c = document.documentElement.classList;
  return c.contains("dark") ? "dark" : c.contains("light") ? "light" : "system";
};

/** Whether the page is currently *rendering* dark, resolving `system` against the OS — for the few
 * places that need the real value (canvas colours, image treatment), not for styling. */
export function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const t = read();
      setDark(t === "dark" || (t === "system" && mq.matches));
    };
    sync();
    mq.addEventListener("change", sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", sync);
      obs.disconnect();
    };
  }, []);
  return dark;
}

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => setTheme(read()), []);

  return (
    // real radios, visually hidden: the roving-focus and arrow-key behaviour of a radiogroup is
    // free from the platform, and re-implementing it on buttons is how that behaviour gets lost
    <fieldset className="flex gap-px bg-rule p-px">
      <legend className="sr-only">Colour scheme</legend>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <label
            key={value}
            title={label}
            className={
              "flex cursor-pointer items-center p-1.5 transition-colors duration-150 has-focus-visible:outline has-focus-visible:outline-accent " +
              (active
                ? "bg-accent text-paper"
                : "bg-paper text-ink-3 hover:text-ink")
            }
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={active}
              onChange={() => {
                window._setTheme(value);
                setTheme(value);
              }}
              className="sr-only"
            />
            <Icon className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only">{label}</span>
          </label>
        );
      })}

      <AccentTogglePicker />
    </fieldset>
  );
}

const AccentTogglePicker = () => {
  const accentRef = useRef<RgbColor>({ r: 0, g: 0, b: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const onUpdateColor = (c: RgbColor) => {
    const color = `rgb(${c.r},${c.g},${c.b})`;
    // is-open will trigger rerender to update the value
    accentRef.current = c;

    document.documentElement.style.setProperty("--accent", color);
  };

  return (
    <Popover
      isOpen={isOpen}
      positions={["bottom", "right", "left"]}
      content={
        <RgbColorPicker onChangeEnd={onUpdateColor} color={accentRef.current} />
      }
      onClickOutside={() => setIsOpen(false)}
      containerClassName="z-100 m-5"
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center mx-1 cursor-pointer"
      >
        <div className="size-5 rounded-full bg-[conic-gradient(#3b82f6,#8b5cf6,#ec4899,#f59e0b,#10b981,#3b82f6)]"></div>
      </div>
    </Popover>
  );
};
