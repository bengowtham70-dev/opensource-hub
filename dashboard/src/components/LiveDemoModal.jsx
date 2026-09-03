import { useState } from "react";
import { Play, ExternalLink, X, Globe, Sparkles } from "lucide-react";

export default function LiveDemoModal({ demoUrl, name = "", repo = "" }) {
  const [open, setOpen] = useState(false);
  const repoName = name || (repo ? repo.split("/")[1] : "App");

  if (!demoUrl) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-trust/30 bg-trust/10 text-trust hover:bg-trust/15 text-[12.5px] font-semibold transition-colors"
        title={`Try ${repoName} live in your browser`}
      >
        <Play size={13} className="fill-current" />
        <span>Try Live Demo</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-4xl max-h-[90vh] card-elevated flex flex-col overflow-hidden shadow-2xl border border-line-strong"
            role="dialog"
            aria-modal="true"
            aria-label={`${repoName} Live Web Demo`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-trust" />
                <span className="font-display font-bold text-ink">{repoName} — Live Sandbox Demo</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line text-[11.5px] text-dim hover:text-ink"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink size={11} />
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-tactile p-1.5 rounded-lg border border-line text-faint hover:text-ink"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sandbox Embed */}
            <div className="flex-1 w-full bg-canvas min-h-[500px] relative">
              <iframe
                src={demoUrl}
                title={`${repoName} live sandbox`}
                className="w-full h-full min-h-[500px] border-0"
                allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
