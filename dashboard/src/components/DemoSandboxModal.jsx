import { useState, useEffect } from "react";
import { ExternalLink, X, Maximize2, Minimize2, Shield, RefreshCw, AlertCircle } from "lucide-react";

export default function DemoSandboxModal({ open, onClose, name, demoUrl }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!open) {
      setFullscreen(false);
      setIframeError(false);
      return;
    }
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !demoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
      <div
        className={`card-elevated flex flex-col bg-surface border border-line rounded-2xl shadow-xl overflow-hidden transition-all duration-200 ${
          fullscreen ? "fixed inset-3 z-50 w-auto h-auto rounded-xl" : "w-full max-w-5xl h-[85vh]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`${name} Live Demo Sandbox`}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line bg-canvas/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="size-2.5 rounded-full bg-trust animate-pulse shrink-0" />
            <span className="font-display font-bold text-sm text-ink truncate">{name} Live Web Demo</span>
            <span className="hidden sm:inline-flex text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-trust/10 text-trust border border-trust/20 shrink-0">
              Interactive Sandbox
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink transition-colors"
              title="Open demo in new window"
            >
              <span>Open in New Tab</span>
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="btn-tactile p-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-dim hover:text-ink transition-colors cursor-pointer"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-tactile p-1.5 rounded-lg border border-line bg-surface hover:bg-elevated text-dim hover:text-ink transition-colors cursor-pointer"
              title="Close Demo"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sandbox Content Area */}
        <div className="relative flex-1 w-full h-full bg-canvas overflow-hidden">
          {!iframeError ? (
            <iframe
              src={demoUrl}
              title={`${name} live demo instance`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              className="w-full h-full border-0"
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
                <AlertCircle size={24} />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-display font-bold text-base text-ink">External Sandbox Protection</h3>
                <p className="text-xs text-dim leading-relaxed">
                  {name} restricts direct inline browser embedding via security headers. You can launch the official hosted sandbox directly in a new window.
                </p>
              </div>
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink dark:bg-surface text-surface dark:text-ink text-sm font-semibold shadow-xs hover:opacity-90 transition-opacity"
              >
                <span>Launch {name} Demo</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-2.5 border-t border-line bg-canvas/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-faint shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-trust" />
            <span>Isolated preview sandbox — if embedding is blocked by remote site headers, use "Open in New Tab"</span>
          </div>
          <a
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ember hover:underline font-medium flex items-center gap-1"
          >
            <span className="truncate max-w-xs">{demoUrl}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
