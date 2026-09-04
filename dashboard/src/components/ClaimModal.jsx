import { useState } from "react";
import { Check, Copy, ShieldCheck, X, FileCode, ExternalLink, AlertCircle, Sparkles, RefreshCw, Trash2 } from "lucide-react";

export default function ClaimModal({ open, onClose, repo = "", name = "", initialClaim = null, onVerified = null }) {
  const [tab, setTab] = useState("proof"); // "proof" | "profile"
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unclaiming, setUnclaiming] = useState(false);
  const [result, setResult] = useState(null);

  // Form state
  const [maintainerName, setMaintainerName] = useState(initialClaim?.maintainer?.name || "");
  const [role, setRole] = useState(initialClaim?.maintainer?.role || "Core Maintainer");
  const [tagline, setTagline] = useState(initialClaim?.maintainer?.tagline || `Official maintainer of ${name || repo}`);
  const [recommendedStack, setRecommendedStack] = useState(initialClaim?.maintainer?.recommendedStack || "Docker Compose (Official)");
  const [supportUrl, setSupportUrl] = useState(initialClaim?.maintainer?.supportUrl || `https://github.com/${repo}/discussions`);

  if (!open) return null;

  const jsonSnippet = JSON.stringify(
    {
      $schema: "https://opensource-hub.org/schema/maintainer-v1.json",
      repo,
      verified: true,
      maintainer: {
        name: maintainerName.trim() || "Core Creator",
        role: role.trim() || "Project Lead",
        tagline: tagline.trim(),
        recommendedStack: recommendedStack.trim(),
        supportUrl: supportUrl.trim(),
      },
      claimedAt: new Date().toISOString(),
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

  const handleVerifyGithub = async () => {
    setVerifying(true);
    setResult(null);
    try {
      const res = await fetch(`/api/claim/${repo}/verify`, { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.verified) {
        onVerified?.(data.claim);
      }
    } catch (err) {
      setResult({ verified: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateClaim = async (e) => {
    e?.preventDefault();
    setVerifying(true);
    setResult(null);
    try {
      const res = await fetch(`/api/claim/${repo}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulate: true,
          maintainer: {
            name: maintainerName.trim() || "Core Creator",
            role: role.trim() || "Core Maintainer",
            tagline: tagline.trim() || `Official maintainer of ${name || repo}`,
            recommendedStack: recommendedStack.trim() || "Docker Compose",
            supportUrl: supportUrl.trim() || `https://github.com/${repo}/discussions`,
          },
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.verified) {
        onVerified?.(data.claim);
      }
    } catch (err) {
      setResult({ verified: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnclaim = async () => {
    setUnclaiming(true);
    try {
      await fetch(`/api/claim/${repo}/unclaim`, { method: "POST" });
      setResult({ verified: false, message: "Claim has been revoked." });
      onVerified?.(null);
    } catch {}
    finally {
      setUnclaiming(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-xl w-full p-6 space-y-5 bg-surface text-ink border border-line rounded-2xl shadow-float max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-trust/15 text-trust grid place-items-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 id="claim-title" className="font-display text-lg font-bold text-ink">
                Claim Repository Verification
              </h3>
              <p className="text-xs text-faint">
                {name || repo} · Verified maintainer status &amp; showcase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-faint hover:text-ink hover:bg-elevated border border-line cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-elevated/70 rounded-xl border border-line text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("proof")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
              tab === "proof"
                ? "bg-surface text-ink shadow-2xs font-bold"
                : "text-faint hover:text-ink"
            }`}
          >
            1. GitHub Proof (.json)
          </button>
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
              tab === "profile"
                ? "bg-surface text-ink shadow-2xs font-bold"
                : "text-faint hover:text-ink"
            }`}
          >
            2. Maintainer Showcase &amp; Sandbox
          </button>
        </div>

        {/* Tab 1: Proof instructions */}
        {tab === "proof" && (
          <div className="space-y-3 text-xs">
            <p className="text-dim leading-relaxed">
              To verify official ownership of <strong>{name || repo}</strong>, commit an <code className="text-ember font-mono font-semibold">.opensource-hub.json</code> file to the root of your default branch on GitHub:
            </p>

            <div className="p-3.5 rounded-xl border border-line bg-elevated/80 space-y-2">
              <div className="font-semibold text-ink flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileCode size={14} className="text-ember" />
                  <span>.opensource-hub.json</span>
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="btn-tactile px-2.5 py-1 rounded-md bg-surface border border-line text-[11px] font-medium inline-flex items-center gap-1 shadow-2xs"
                >
                  {copied ? <Check size={12} className="text-trust" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy Snippet"}</span>
                </button>
              </div>

              <pre className="p-2.5 rounded-lg bg-surface border border-line text-[11px] font-mono text-dim overflow-x-auto select-all leading-normal max-h-48">
                {jsonSnippet}
              </pre>
            </div>

            <p className="text-[11px] text-faint">
              Once committed, our scanner checks the GitHub raw endpoint directly. No third-party OAuth or permissions are requested.
            </p>
          </div>
        )}

        {/* Tab 2: Profile settings & Sandbox simulation */}
        {tab === "profile" && (
          <div className="space-y-3 text-xs">
            <p className="text-dim">
              Customize the verified details displayed on your project's showcase card:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-faint uppercase mb-1">
                  Maintainer Name
                </label>
                <input
                  type="text"
                  value={maintainerName}
                  onChange={(e) => setMaintainerName(e.target.value)}
                  placeholder="e.g. Anoop M D"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-hidden focus:border-line-strong"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-faint uppercase mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Founder & Core Lead"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-hidden focus:border-line-strong"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-faint uppercase mb-1">
                Maintainer Tagline / Message
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Fast, git-friendly, offline-first API client"
                className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-hidden focus:border-line-strong"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-faint uppercase mb-1">
                  Recommended Deployment
                </label>
                <input
                  type="text"
                  value={recommendedStack}
                  onChange={(e) => setRecommendedStack(e.target.value)}
                  placeholder="e.g. Docker Compose / Single Binary"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-hidden focus:border-line-strong"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-faint uppercase mb-1">
                  Discussions / Support URL
                </label>
                <input
                  type="text"
                  value={supportUrl}
                  onChange={(e) => setSupportUrl(e.target.value)}
                  placeholder="https://github.com/.../discussions"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-hidden focus:border-line-strong"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulateClaim}
                disabled={verifying}
                className="w-full py-2 px-3 rounded-xl bg-trust/15 border border-trust/40 text-trust hover:bg-trust/20 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{verifying ? "Activating…" : "Activate Verified Mode (Sandbox Preview)"}</span>
              </button>
              <p className="text-[10px] text-faint text-center mt-1">
                Instantly activates the Verified Maintainer badge and showcase card on this instance.
              </p>
            </div>
          </div>
        )}

        {/* Verification Status Feedback */}
        {result && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              result.verified
                ? "bg-trust/10 border-trust/40 text-trust"
                : "bg-caution/10 border-caution/40 text-caution"
            }`}
          >
            {result.verified ? (
              <Check size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-bold block">
                {result.verified ? "Verified Successfully!" : "Verification Incomplete"}
              </span>
              <span className="text-[11px] block mt-0.5 leading-relaxed">
                {result.message || "Your project now carries the official Verified Maintainer badge and showcase note."}
              </span>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <div>
            {initialClaim && (
              <button
                type="button"
                onClick={handleUnclaim}
                disabled={unclaiming}
                className="text-[11px] text-faint hover:text-caution inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>{unclaiming ? "Revoking…" : "Revoke Verification"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-tactile px-3.5 py-1.5 rounded-xl border border-line text-xs font-medium text-dim hover:text-ink cursor-pointer"
            >
              Close
            </button>

            {tab === "proof" ? (
              <button
                type="button"
                onClick={handleVerifyGithub}
                disabled={verifying}
                className="btn-tactile px-4 py-1.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck size={13} />
                <span>{verifying ? "Checking GitHub…" : "Verify Now (Check GitHub)"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSimulateClaim}
                disabled={verifying}
                className="btn-tactile px-4 py-1.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check size={13} />
                <span>Save &amp; Apply</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
