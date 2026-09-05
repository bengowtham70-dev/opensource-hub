import { useState, useEffect } from "react";
import { X, Download, Puzzle, Check, ExternalLink, Chrome, ShieldCheck, Sparkles, Terminal } from "lucide-react";

export default function ExtensionModal({ open = false, onClose = () => {} }) {
  const [browser, setBrowser] = useState("chrome");
  const [copiedStep, setCopiedStep] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("firefox")) {
      setBrowser("firefox");
    } else if (ua.includes("edg/")) {
      setBrowser("edge");
    } else {
      setBrowser("chrome");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = `/api/extension/download?browser=${browser}`;
    link.download = `opensource-hub-extension-${browser}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 1200);
  };

  const copySnippet = async (text, stepId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Browser Extension Installation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-link flex items-center justify-center border border-orange-200/60 dark:border-orange-800/40 shadow-xs">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                OpenSource Hub Browser Extension
                <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  v0.1.0 Ready
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Automatically alerts you to verified open-source alternatives as you browse SaaS websites.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Interactive Browser Mockup */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden shadow-xs">
            {/* Mock browser top chrome */}
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
              </div>
              <div className="flex-1 max-w-sm mx-auto bg-white dark:bg-zinc-800 px-3 py-0.5 rounded-md border border-zinc-200/60 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-300 font-mono flex items-center justify-between">
                <span>https://www.figma.com/pricing</span>
                <span className="text-[9px] text-zinc-400">🔒</span>
              </div>
            </div>

            {/* Mock website page with floating banner */}
            <div className="p-6 relative min-h-[140px] flex items-center justify-center bg-white dark:bg-zinc-950">
              <div className="text-center text-zinc-300 dark:text-zinc-700 select-none text-xs">
                Proprietary SaaS Application Surface
              </div>

              {/* In-page simulated alert banner */}
              <div className="absolute bottom-3 right-3 bg-zinc-900 dark:bg-zinc-800 text-zinc-100 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700/80 shadow-lg flex items-center gap-3 max-w-[340px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-orange-400 text-xs">
                  ◆
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-[11.5px] truncate">
                    Free Alternative: <span className="text-orange-400 font-semibold">Penpot</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Replaces Figma · Save ~$144/yr
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-link text-white text-[10px] font-semibold whitespace-nowrap">
                  Explore ↗
                </span>
              </div>
            </div>
          </div>

          {/* Browser Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Select Your Target Browser:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "chrome", label: "Chrome / Brave", note: "Manifest V3" },
                { id: "firefox", label: "Mozilla Firefox", note: "Gecko MV3" },
                { id: "edge", label: "Microsoft Edge", note: "Chromium MV3" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setBrowser(item.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                    browser === item.id
                      ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{item.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step-by-Step Developer Installation Guide */}
          <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              Quick 1-Minute Installation (Developer Mode):
            </h3>

            <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal list-inside">
              <li>
                Download and extract the <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">.zip</code> package below.
              </li>
              <li>
                {browser === "firefox" ? (
                  <span>
                    Open <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">about:debugging#/runtime/this-firefox</code> and click <strong>Load Temporary Add-on</strong>.
                  </span>
                ) : (
                  <span>
                    Open <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[11px]">{browser === "edge" ? "edge://extensions" : "chrome://extensions"}</code> and toggle <strong>Developer mode</strong> (top-right).
                  </span>
                )}
              </li>
              <li>
                Click <strong>Load unpacked</strong> and select the extracted folder.
              </li>
            </ol>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>100% Privacy Guarantee:</strong> The extension operates entirely locally. It contains zero analytics, phones home never, and only runs on target SaaS domains.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Store submission bundle ready for Web Stores
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              {downloading ? "Preparing Bundle..." : `Download for ${browser === "firefox" ? "Firefox" : browser === "edge" ? "Edge" : "Chrome"} (.zip)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
