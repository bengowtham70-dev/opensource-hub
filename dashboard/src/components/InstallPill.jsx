import { useEffect, useRef, useState } from "react";
import { Copy, Check, TerminalSquare } from "lucide-react";

// PRD section 19 Phase-1 mandate — dashboard first-run hero carries a
// copy-able install-command pill so early users can share it in one click.
const CMD = "npm install -g opensource-hub";

export default function InstallPill() {
  const codeRef = useRef(null);
  const timer = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CMD);
    } catch {
      try {
        codeRef.current?.setAttribute?.("tabindex", "0");
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        getSelection()?.removeAllRanges();
        getSelection()?.addRange(range);
        document.execCommand?.("copy");
      } catch {}
    }
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      copy();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={copy}
      onKeyDown={onKeyDown}
      className={`card-elevated btn-tactile group inline-flex items-center gap-2.5 pl-3.5 pr-2 py-2 rounded-full max-w-full cursor-pointer select-none transition-colors ${
        copied ? "border-trust/40 bg-trust/5" : "hover:border-line-strong"
      }`}
      aria-label="Copy install command"
      title="Click to copy command"
    >
      <TerminalSquare size={15} className={`shrink-0 transition-colors ${copied ? "text-trust" : "text-dim group-hover:text-ink"}`} aria-hidden="true" />
      <code
        ref={codeRef}
        className="tnum text-[13px] text-dim truncate group-hover:text-ink transition-colors"
        title={CMD}
      >
        <span className="text-faint">$ </span>
        npm install -g <span className="text-tech">opensource-hub</span>
      </code>
      {copied && (
        <span className="text-[11.5px] font-semibold text-trust animate-card-in">
          Copied!
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copy();
        }}
        aria-label="Copy install command"
        aria-pressed={copied}
        className={`btn-tactile shrink-0 grid place-items-center size-7 rounded-full border transition-colors ${
          copied
            ? "bg-trust/20 border-trust/50 text-trust"
            : "border-line text-faint group-hover:text-dim group-hover:border-line-strong"
        }`}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}
