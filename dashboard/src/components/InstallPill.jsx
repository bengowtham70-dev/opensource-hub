import { useEffect, useRef, useState } from "react";
import { Copy, Check, TerminalSquare, Apple, Monitor, Terminal } from "lucide-react";

// PRD §30 Multi-Channel Distribution: Homebrew, Windows (Winget/Scoop), Curl/Shell, npm/npx
const CHANNELS = [
  {
    id: "npm",
    label: "npm / npx",
    prompt: "$ ",
    cmd: "npm install -g opensource-hub",
    highlight: "opensource-hub",
    note: "Zero-install run: npx opensource-hub",
  },
  {
    id: "brew",
    label: "Homebrew",
    prompt: "$ ",
    cmd: "brew install bengowtham70/tap/opensource-hub",
    highlight: "bengowtham70/tap/opensource-hub",
    note: "Official macOS & Linux Homebrew Tap",
  },
  {
    id: "windows",
    label: "Windows",
    prompt: "> ",
    cmd: "winget install OpenSourceHub.OpenSourceHub",
    highlight: "OpenSourceHub.OpenSourceHub",
    note: "Or PowerShell: irm .../install.ps1 | iex",
  },
  {
    id: "curl",
    label: "Curl / POSIX",
    prompt: "$ ",
    cmd: "curl -fsSL https://raw.githubusercontent.com/bengowtham70/opensource-hub/main/install.sh | sh",
    highlight: "install.sh",
    note: "Auto-detects architecture & installs standalone binary",
  },
];

export default function InstallPill() {
  const [activeId, setActiveId] = useState("npm");
  const [copied, setCopied] = useState(false);
  const [detected, setDetected] = useState(null);
  const timer = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    // Client-side OS auto-detection per PRD §30
    if (typeof navigator !== "undefined") {
      const ua = (navigator.userAgent || "").toLowerCase();
      const platform = (navigator.platform || "").toLowerCase();
      if (platform.includes("win") || ua.includes("windows")) {
        setActiveId("windows");
        setDetected("windows");
      } else if (platform.includes("mac") || ua.includes("macintosh")) {
        setActiveId("brew");
        setDetected("brew");
      } else if (platform.includes("linux") || ua.includes("linux")) {
        setActiveId("curl");
        setDetected("curl");
      }
    }
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const activeChannel = CHANNELS.find((c) => c.id === activeId) || CHANNELS[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(activeChannel.cmd);
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

  return (
    <div className="inline-flex flex-col items-center gap-2 max-w-full">
      {/* Channel Switcher Tabs */}
      <div
        role="tablist"
        aria-label="Installation channels"
        className="inline-flex items-center gap-1 p-1 rounded-full border border-line bg-surface/80 backdrop-blur-xs shadow-2xs"
      >
        {CHANNELS.map((ch) => {
          const isActive = ch.id === activeId;
          const isAutoDetected = ch.id === detected;
          return (
            <button
              key={ch.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => {
                setActiveId(ch.id);
                setCopied(false);
              }}
              className={`btn-tactile px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-ink text-surface dark:bg-surface dark:text-ink shadow-2xs"
                  : "text-dim hover:text-ink hover:bg-elevated"
              }`}
            >
              <span>{ch.label}</span>
              {isAutoDetected && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-trust/15 text-trust font-bold uppercase tracking-wider">
                  Auto
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Command Pill */}
      <div
        role="button"
        tabIndex={0}
        onClick={copy}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            copy();
          }
        }}
        className={`card-elevated btn-tactile group inline-flex items-center justify-between gap-3 pl-3.5 pr-2 py-2 rounded-2xl max-w-full cursor-pointer select-none transition-all ${
          copied ? "border-trust/40 bg-trust/5" : "hover:border-line-strong bg-surface"
        }`}
        aria-label="Copy install command"
        title="Click to copy command"
      >
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <TerminalSquare
            size={15}
            className={`shrink-0 transition-colors ${copied ? "text-trust" : "text-dim group-hover:text-ink"}`}
            aria-hidden="true"
          />
          <code
            ref={codeRef}
            className="tnum text-xs md:text-[13px] text-dim truncate group-hover:text-ink transition-colors font-mono"
            title={activeChannel.cmd}
          >
            <span className="text-faint">{activeChannel.prompt}</span>
            {activeChannel.cmd.split(activeChannel.highlight).map((part, idx, arr) => (
              <span key={idx}>
                {part}
                {idx < arr.length - 1 && (
                  <span className="text-tech font-semibold">{activeChannel.highlight}</span>
                )}
              </span>
            ))}
          </code>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            className={`btn-tactile shrink-0 grid place-items-center size-7 rounded-xl border transition-colors ${
              copied
                ? "bg-trust/20 border-trust/50 text-trust"
                : "border-line text-faint group-hover:text-dim group-hover:border-line-strong"
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}
