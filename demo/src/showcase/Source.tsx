import { useState } from 'react';

/** The plate's own source, as a specimen listing.
 *
 * Deliberately not syntax-highlighted: every highlighter worth using (shiki, prism) is either a
 * build step or a runtime dependency several times the size of the library this page is about, and
 * a hand-rolled regex one is wrong on the first generic. A numbered monospaced listing is what a
 * spec sheet does anyway — the colour on this page is reserved for things you can change. */
export function Source({ code, id }: { code: string; id: string }) {
  const [isOpen, setOpen] = useState(false);
  const [isCopied, setCopied] = useState(false);
  const lines = code.replace(/\s+$/, '').split('\n');

  return (
    <div className="border-t border-rule">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={`${id}-source`}
          className="spec group flex cursor-pointer items-center gap-2 py-3 hover:text-ink"
        >
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 ease-plate"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
          >
            ▸
          </span>
          source · {lines.length} lines
        </button>

        {isOpen && (
          <button
            type="button"
            className="spec cursor-pointer text-accent"
            onClick={() => {
              navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              });
            }}
          >
            {isCopied ? 'copied' : 'copy'}
          </button>
        )}
      </div>

      {isOpen && (
        <pre
          id={`${id}-source`}
          className="mb-4 max-h-[28rem] overflow-auto border border-rule bg-sunk p-4 font-mono text-[12px] leading-[1.7] text-ink-2"
        >
          <code>
            {lines.map((line, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a source listing is a fixed array
              <span key={i} className="grid grid-cols-[2.5rem_1fr]">
                <span className="text-right text-ink-3/60 select-none">{i + 1}</span>
                <span className="pl-4 whitespace-pre">{line || ' '}</span>
              </span>
            ))}
          </code>
        </pre>
      )}
    </div>
  );
}
