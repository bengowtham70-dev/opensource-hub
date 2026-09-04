import { useState } from "react";
import { X, AlertCircle, Check, Flag, ExternalLink, Send } from "lucide-react";
import { api } from "../lib/api";

const FEEDBACK_REPO = "bengowtham70/opensource-hub";

export default function ReportIssueModal({
  open = false,
  onClose = () => {},
  repo = "",
  name = "",
  replaces = "",
}) {
  const [form, setForm] = useState({
    reason: "Inaccurate Pricing",
    field: "pricing",
    currentClaim: "",
    suggestedValue: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.note && !form.suggestedValue) return;
    setSubmitting(true);

    const title = `[Data Audit] ${repo}: ${form.reason}`;
    const body = encodeURIComponent(
      `## Data Discrepancy Report for ${repo}\n\n` +
      `**Category/Field:** ${form.reason}\n` +
      `**Current In-App Claim:** ${form.currentClaim || "N/A"}\n` +
      `**Correct Information / Source:** ${form.suggestedValue || "N/A"}\n` +
      `**Details & Reproduction:**\n${form.note}\n\n` +
      `_Submitted from OpenSource Hub Accuracy Protocol._`
    );
    const issueLink = `https://github.com/${FEEDBACK_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${body}`;
    setGithubUrl(issueLink);

    try {
      await api.communityFlag({
        repo,
        field: form.field || form.reason,
        reason: form.reason,
        currentClaim: form.currentClaim,
        suggestedValue: form.suggestedValue,
        note: form.note,
      });
      setSubmitted(true);
    } catch {
      // Still allow GitHub submission even if local daemon had an issue
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setForm({
      reason: "Inaccurate Pricing",
      field: "pricing",
      currentClaim: "",
      suggestedValue: "",
      note: "",
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-issue-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={resetAndClose}
    >
      <div
        className="card-elevated max-w-lg w-full p-6 space-y-4 bg-surface text-ink border border-line shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-amber-500" />
            <h3 id="report-issue-title" className="font-display text-base font-bold text-ink">
              Report Data Discrepancy · {name || repo}
            </h3>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-faint hover:text-ink hover:bg-elevated border border-line cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-12 rounded-full bg-trust/10 text-trust grid place-items-center mx-auto">
              <Check size={24} />
            </div>
            <div>
              <h4 className="font-bold text-ink text-sm">Discrepancy Logged Locally</h4>
              <p className="text-xs text-dim mt-1 max-w-sm mx-auto">
                Thank you! Your audit report has been saved to the local verification queue.
              </p>
            </div>

            {githubUrl && (
              <div className="p-3 rounded-xl bg-elevated border border-line text-xs space-y-2">
                <span className="text-dim block">
                  To publish this dispute to the public maintainer board on GitHub:
                </span>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink font-semibold text-xs cursor-pointer"
                >
                  <span>Open Public GitHub Issue</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={resetAndClose}
              className="btn-tactile px-4 py-2 rounded-xl border border-line bg-surface hover:bg-elevated text-xs font-semibold text-ink cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-dim font-medium mb-1">Issue Category *</label>
              <select
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    reason: e.target.value,
                    field: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink outline-none focus:border-ember"
              >
                <option value="Inaccurate Pricing">Inaccurate Commercial Pricing / Plan Tier</option>
                <option value="Missing Core Feature">Missing Core Feature listed as Supported</option>
                <option value="Broken Demo Link">Broken / Dead Official Demo Instance</option>
                <option value="License Mismatch">License Mismatch / Restriction Undisclosed</option>
                <option value="Self-Hosting Complexity">Self-Hosting Difficulty Misclassified</option>
                <option value="Other Inaccuracy">Other Catalog Metadata Error</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-dim font-medium mb-1">Current Stated Value</label>
                <input
                  type="text"
                  value={form.currentClaim}
                  onChange={(e) => setForm((f) => ({ ...f, currentClaim: e.target.value }))}
                  placeholder={`e.g. $${replaces ? 240 : 100}/yr or 'One-click'`}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                />
              </div>
              <div>
                <label className="block text-dim font-medium mb-1">Correct Value / Fix</label>
                <input
                  type="text"
                  value={form.suggestedValue}
                  onChange={(e) => setForm((f) => ({ ...f, suggestedValue: e.target.value }))}
                  placeholder="e.g. $360/yr or Requires Docker"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                />
              </div>
            </div>

            <div>
              <label className="block text-dim font-medium mb-1">Details &amp; Supporting Link *</label>
              <textarea
                required
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Explain what is inaccurate and provide official documentation or pricing page link..."
                className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-faint">
                PRD §10 &amp; §34 Accuracy Protocol
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-elevated text-ink font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink hover:opacity-90 font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{submitting ? "Submitting..." : "Submit Discrepancy"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
