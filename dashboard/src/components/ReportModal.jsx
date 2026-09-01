import { useState } from "react";
import { Flag, Check, X, Send } from "lucide-react";

export default function ReportModal({ open, onClose, repo, name }) {
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState("outdated");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-caution" />
            <h3 id="report-title" className="font-display text-lg font-bold">
              Report or Suggest Edits
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-faint hover:text-ink hover:bg-surface"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="size-10 rounded-full bg-trust/10 text-trust mx-auto grid place-items-center">
              <Check size={20} />
            </div>
            <h4 className="font-display font-medium text-sm">Feedback Received</h4>
            <p className="text-xs text-dim">
              Thank you for helping keep OpenSource Hub accurate and up-to-date!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-dim">
              Found inaccurate data, broken links, or missing features for <strong>{name}</strong>? Let us know.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-faint">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-line bg-surface text-ink"
              >
                <option value="outdated">Outdated features / pricing / version</option>
                <option value="broken-link">Broken demo or repository link</option>
                <option value="missing-stack">Missing tech stack or alternative pairing</option>
                <option value="license">Inaccurate license or metadata</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-faint">
                Details & Reference Links
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the issue or provide updated links/facts..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-line bg-surface text-ink placeholder:text-faint resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-dim hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-tactile px-4 py-1.5 rounded-lg bg-ink text-surface text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90"
              >
                <Send size={13} />
                <span>Submit report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
