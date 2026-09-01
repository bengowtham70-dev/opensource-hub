import { useState } from "react";
import { Check, Copy, ShieldCheck, X, FileCode, ExternalLink, AlertCircle } from "lucide-react";

export default function ClaimModal({ open, onClose, repo = "", name = "" }) {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  if (!open) return null;

  const jsonSnippet = JSON.stringify(
    {
      $schema: "https://opensource-hub.org/schema/maintainer-v1.json",
      repo,
      verified: true,
      notes: "Official configuration for OpenSource Hub maintainer verification.",
    },
    null,
    2
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(jsonSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);
    try {
      const res = await fetch(`/api/claim/${repo}/verify`, { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ verified: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-lg w-full p-6 space-y-4 bg-surface text-ink border border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-trust" />
            <h3 id="claim-title" className="font-display text-lg font-bold text-ink">
              Claim Repository Verification
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

        <p className="text-xs text-dim leading-relaxed">
          Are you the maintainer of <strong>{name || repo}</strong>? Claiming your project gives you the <strong>Verified Maintainer</strong> badge and lets you edit feature parity.
        </p>

        {/* Instructions */}
        <div className="p-3.5 rounded-xl border border-line bg-elevated space-y-2 text-xs">
          <div className="font-semibold text-ink flex items-center gap-1.5">
            <FileCode size={14} className="text-ember" /> Step 1: Add config file to repo
          </div>
          <p className="text-faint text-[11.5px]">
            Commit a file named <code className="text-ember font-mono">.opensource-hub.json</code> to your repository's root on the default branch:
          </p>
          <div className="relative mt-1.5">
            <pre className="p-2.5 rounded-lg bg-surface border border-line text-[11px] font-mono text-dim overflow-x-auto select-all">
              {jsonSnippet}
            </pre>
            <button
              type="button"
              onClick={copyCode}
              className="btn-tactile absolute right-2 top-2 px-2 py-1 rounded bg-surface border border-line text-[10px] font-medium inline-flex items-center gap-1"
            >
              {copied ? <Check size={11} className="text-trust" /> : <Copy size={11} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Verification Status */}
        {result && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              result.verified
                ? "bg-trust/10 border-trust/30 text-trust"
                : "bg-caution/10 border-caution/30 text-caution"
            }`}
          >
            {result.verified ? <Check size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <div>
              <span className="font-semibold block">{result.verified ? "Verified Successfully!" : "Verification Incomplete"}</span>
              <span className="text-[11px]">{result.message || "Your project now carries the Verified Maintainer badge."}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile px-3.5 py-1.5 rounded-lg border border-line text-xs font-medium text-dim hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="btn-tactile px-4 py-1.5 rounded-lg bg-ink text-white dark:bg-white dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <ShieldCheck size={13} />
            <span>{verifying ? "Checking GitHub…" : "Verify Now"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
