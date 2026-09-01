import { useState } from "react";
import { X, Sparkles, Check, Send } from "lucide-react";

export default function SuggestModal({
  open = false,
  onClose = () => {},
  prefilledReplaces = "",
  prefilledCategory = "",
}) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    replaces: prefilledReplaces,
    category: prefilledCategory || "Developer Tools",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.url) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1500);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggest-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card-elevated max-w-md w-full p-6 space-y-4 bg-surface text-ink border border-line shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            <h3 id="suggest-modal-title" className="font-display text-base font-bold text-ink">
              Suggest Alternative {prefilledReplaces ? `for ${prefilledReplaces}` : ""}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-faint hover:text-ink hover:bg-elevated border border-line cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="size-12 rounded-full bg-trust/10 text-trust grid place-items-center mx-auto">
              <Check size={24} />
            </div>
            <h4 className="font-bold text-ink">Candidate Submitted!</h4>
            <p className="text-xs text-dim">
              Thank you! Our maintainer team and automated scanner will verify the license and repository health.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-dim font-medium mb-1">Open-Source Project Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. AppFlowy, Cal.com, Vaultwarden"
                className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
              />
            </div>

            <div>
              <label className="block text-dim font-medium mb-1">GitHub / GitLab Repository URL *</label>
              <input
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://github.com/owner/repo"
                className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-dim font-medium mb-1">Replaced Tool</label>
                <input
                  type="text"
                  value={form.replaces}
                  onChange={(e) => setForm((f) => ({ ...f, replaces: e.target.value }))}
                  placeholder="e.g. Notion"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                />
              </div>

              <div>
                <label className="block text-dim font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Developer Tools"
                  className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                />
              </div>
            </div>

            <div>
              <label className="block text-dim font-medium mb-1">Why is this project great? (Optional)</label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Key parity features, self-hosting ease, or performance highlights."
                className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-dim hover:text-ink font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-tactile px-4 py-1.5 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-sm hover:opacity-90 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={13} />
                <span>{submitting ? "Submitting…" : "Submit Candidate"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
