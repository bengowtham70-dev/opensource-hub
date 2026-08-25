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
      // Clipboard denied — select the text as fallback so copy still works.
      codeRef.current?.setAttribute?.("tabindex", "0");
      const range = document.createRange();
      range.selectNodeContents(codeRef.current);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      return;
    }
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className="card-glass inline-flex items-center gap-2.5 pl-3.5 pr-2 py-2 rounded-full max-w-full"
      role="group"
      aria-label="Install command"
    >
      <TerminalSquare size={15} className="text-primary shrink-0" aria-hidden="true" />
      <code
        ref={codeRef}
        className="tnum text-[13px] text-dim truncate"
        title={CMD}
      >
        <span className="text-faint">$ </span>
        npm install -g <span className="text-tech">opensource-hub</span>
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy install command"
        aria-pressed={copied}
        className={`btn-tactile shrink-0 grid place-items-center size-7 rounded-full border transition-colors ${
          copied
            ? "bg-trust/15 border-trust/40 text-trust"
            : "border-line text-faint hover:text-dim hover:border-line-strong"
        }`}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}
