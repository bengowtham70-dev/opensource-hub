import { useState } from "react";
import { Check, Copy, Code2, X, ShieldCheck, Sparkles, Tag } from "lucide-react";

export default function EmbedModal({ open, onClose, repo = "", name = "" }) {
  const [badgeType, setBadgeType] = useState("trust"); // "trust", "alternative", "shield"
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  if (!open) return null;

  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:3000";
  const targetUrl = `${origin}/repo/${repo}`;

  let badgeUrl = `${origin}/api/badge/${repo}/trust.svg`;
  if (badgeType === "alternative") {
    badgeUrl = `${origin}/api/badge/${repo}/alternative.svg`;
  } else if (badgeType === "shield") {
    badgeUrl = `https://img.shields.io/badge/OpenSource%20Hub-${encodeURIComponent(name || repo)}-FF5722?logo=github`;
  }

  const mdSnippet = `[![OpenSource Hub](${badgeUrl})](${targetUrl})`;
  const htmlSnippet = `<a href="${targetUrl}"><img src="${badgeUrl}" alt="${name} on OpenSource Hub" /></a>`;

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(mdSnippet);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 1600);
    } catch {}
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlSnippet);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 1600);
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="embed-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-lg w-full p-6 space-y-4 bg-surface text-ink border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 size={18} className="text-ember" />
            <h3 id="embed-title" className="font-display text-lg font-bold text-ink">
              Embed Badge on your README
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-faint hover:text-ink hover:bg-surface border border-line"
          >
            <X size={16} />
          </button>
        </div>

        {/* Badge Style Selector Tabs */}
        <div className="flex p-1 rounded-lg border border-line bg-elevated gap-1">
          <button
            type="button"
            onClick={() => setBadgeType("trust")}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              badgeType === "trust" ? "bg-surface text-ink shadow-2xs border border-line" : "text-faint hover:text-ink"
            }`}
          >
            <ShieldCheck size={13} className="text-trust" />
            <span>Trust Score</span>
          </button>
          <button
            type="button"
            onClick={() => setBadgeType("alternative")}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              badgeType === "alternative" ? "bg-surface text-ink shadow-2xs border border-line" : "text-faint hover:text-ink"
            }`}
          >
            <Tag size={13} className="text-ember" />
            <span>Replaces Tag</span>
          </button>
          <button
            type="button"
            onClick={() => setBadgeType("shield")}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              badgeType === "shield" ? "bg-surface text-ink shadow-2xs border border-line" : "text-faint hover:text-ink"
            }`}
          >
            <Sparkles size={13} className="text-caution" />
            <span>Featured Mark</span>
          </button>
        </div>

        {/* Live Badge Preview */}
        <div className="p-4 rounded-xl border border-line bg-elevated flex items-center justify-center min-h-[56px]">
          <img src={badgeUrl} alt="OpenSource Hub Live Badge Preview" className="h-5 object-contain" />
        </div>

        {/* Markdown Snippet */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-faint">
            Markdown (for README.md)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={mdSnippet}
              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-line bg-elevated text-dim select-all outline-none"
            />
            <button
              type="button"
              onClick={copyMd}
              className="btn-tactile shrink-0 px-3 py-2 rounded-lg border border-line hover:border-line-strong text-xs font-medium inline-flex items-center gap-1.5 bg-surface"
            >
              {copiedMd ? <Check size={14} className="text-trust" /> : <Copy size={14} />}
              <span>{copiedMd ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* HTML Snippet */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-faint">
            HTML (for Websites)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={htmlSnippet}
              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-line bg-elevated text-dim select-all outline-none"
            />
            <button
              type="button"
              onClick={copyHtml}
              className="btn-tactile shrink-0 px-3 py-2 rounded-lg border border-line hover:border-line-strong text-xs font-medium inline-flex items-center gap-1.5 bg-surface"
            >
              {copiedHtml ? <Check size={14} className="text-trust" /> : <Copy size={14} />}
              <span>{copiedHtml ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
