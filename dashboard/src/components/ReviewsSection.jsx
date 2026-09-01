import { useEffect, useState } from "react";
import { Star, MessageSquarePlus, Check, X, ThumbsUp, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";

export default function ReviewsSection({ repo = "", name = "", replaces = "" }) {
  const [data, setData] = useState({ averageRating: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, author: "", role: "", switchedFrom: replaces, summary: "", content: "", pros: "", cons: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchReviews = async () => {
    if (!repo) return;
    try {
      const res = await fetch(`/api/reviews/${repo}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [repo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary && !form.content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${repo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pros: form.pros.split(",").map((p) => p.trim()).filter(Boolean),
          cons: form.cons.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
        setSubmitted(true);
        setTimeout(() => {
          setModalOpen(false);
          setSubmitted(false);
          setForm({ rating: 5, author: "", role: "", switchedFrom: replaces, summary: "", content: "", pros: "", cons: "" });
        }, 1200);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <section className="mt-8 space-y-6 animate-card-in" aria-labelledby="reviews-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="reviews-heading" className="font-display text-xl sm:text-2xl font-bold text-ink">
              Developer Reviews & Switcher Stories
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-trust/10 text-trust font-mono text-xs font-semibold">
              Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dim mt-1">
            Real feedback and migration experiences from developers who made the switch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink hover:opacity-90 text-xs sm:text-sm font-semibold shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <MessageSquarePlus size={16} />
          <span>Write a Switcher Review</span>
        </button>
      </div>

      {/* Overview & Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-5 rounded-2xl bg-surface border border-line flex flex-col items-center justify-center text-center">
          <span className="font-display text-4xl sm:text-5xl font-bold text-ink tnum">
            {data.total > 0 ? data.averageRating : "5.0"}
          </span>
          <div className="flex items-center gap-1 text-amber-500 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= (data.total > 0 ? Math.round(data.averageRating) : 5) ? "fill-amber-500" : "text-faint"}
              />
            ))}
          </div>
          <span className="text-xs text-faint mt-1.5">
            Based on {data.total} {data.total === 1 ? "review" : "developer reviews"}
          </span>
        </div>

        <div className="card-elevated p-5 rounded-2xl bg-surface border border-line md:col-span-2 space-y-2 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = data.distribution?.[stars] || 0;
            const pct = data.total > 0 ? Math.round((count / data.total) * 100) : stars === 5 ? 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-dim font-medium">{stars} stars</span>
                <div className="flex-1 h-2 rounded-full bg-elevated border border-line overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-faint tnum">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Cards Feed */}
      {data.reviews.length === 0 ? (
        <div className="card-elevated p-8 text-center rounded-2xl border border-dashed border-line space-y-3 bg-surface/50">
          <p className="text-sm font-medium text-ink">Be the first developer to share your experience with {name}!</p>
          <p className="text-xs text-dim max-w-[50ch] mx-auto">
            Did you replace {replaces || "proprietary software"} with {name}? Tell fellow developers about migration ease and performance.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-tactile px-3.5 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink hover:bg-elevated inline-flex items-center gap-1.5"
          >
            <span>Add First Review</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.reviews.map((rev) => (
            <div key={rev.id} className="card-elevated p-5 rounded-2xl bg-surface border border-line space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-ink">{rev.author}</span>
                    {rev.role && <span className="text-[11px] text-faint">· {rev.role}</span>}
                  </div>
                  {rev.switchedFrom && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-ember/10 border border-ember/20 text-ember font-medium text-[11px]">
                      Migrated from {rev.switchedFrom}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} className={s <= rev.rating ? "fill-amber-500" : "text-faint"} />
                  ))}
                </div>
              </div>

              <h4 className="font-semibold text-xs sm:text-sm text-ink leading-snug">{rev.summary}</h4>
              {rev.content && <p className="text-xs text-dim leading-relaxed">{rev.content}</p>}

              {(rev.pros?.length > 0 || rev.cons?.length > 0) && (
                <div className="pt-2 border-t border-line/60 space-y-1.5 text-[11.5px]">
                  {rev.pros?.length > 0 && (
                    <div className="flex items-start gap-1.5 text-trust">
                      <span className="font-bold">Pros:</span>
                      <span className="text-dim">{rev.pros.join(" · ")}</span>
                    </div>
                  )}
                  {rev.cons?.length > 0 && (
                    <div className="flex items-start gap-1.5 text-caution">
                      <span className="font-bold">Cons:</span>
                      <span className="text-dim">{rev.cons.join(" · ")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Submission Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card-elevated max-w-lg w-full p-6 space-y-4 bg-surface text-ink border border-line shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 id="review-modal-title" className="font-display text-lg font-bold text-ink">
                Review & Switcher Story for {name}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded-md text-faint hover:text-ink hover:bg-elevated border border-line"
              >
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="size-12 rounded-full bg-trust/10 text-trust grid place-items-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="font-bold text-ink">Review Published!</h4>
                <p className="text-xs text-dim">Thank you for sharing your migration experience with the community.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-dim font-medium mb-1">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, rating: star }))}
                        className="p-1 cursor-pointer text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star size={22} className={star <= form.rating ? "fill-amber-500" : "text-faint"} />
                      </button>
                    ))}
                    <span className="text-dim font-semibold ml-2">{form.rating} / 5 Stars</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dim font-medium mb-1">Your Name or Handle</label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      placeholder="e.g. Sarah_dev"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                    />
                  </div>
                  <div>
                    <label className="block text-dim font-medium mb-1">Role / Team Size</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      placeholder="e.g. Tech Lead (15 devs)"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-dim font-medium mb-1">Replaced Tool (Switcher Badge)</label>
                  <input
                    type="text"
                    value={form.switchedFrom}
                    onChange={(e) => setForm((f) => ({ ...f, switchedFrom: e.target.value }))}
                    placeholder="e.g. Notion, Jira, Slack"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                  />
                </div>

                <div>
                  <label className="block text-dim font-medium mb-1">Headline Summary *</label>
                  <input
                    type="text"
                    required
                    value={form.summary}
                    onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                    placeholder="e.g. Cut cloud costs by 80% with local-first performance"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                  />
                </div>

                <div>
                  <label className="block text-dim font-medium mb-1">Detailed Migration Experience</label>
                  <textarea
                    rows={3}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="How was the setup, migration, and team adoption?"
                    className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dim font-medium mb-1">Top Pros (comma separated)</label>
                    <input
                      type="text"
                      value={form.pros}
                      onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
                      placeholder="Fast, Offline, Markdown"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                    />
                  </div>
                  <div>
                    <label className="block text-dim font-medium mb-1">Top Cons (comma separated)</label>
                    <input
                      type="text"
                      value={form.cons}
                      onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
                      placeholder="Initial sync setup"
                      className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-ember"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-tactile px-3.5 py-1.5 rounded-lg border border-line text-dim hover:text-ink font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-tactile px-4 py-1.5 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink font-semibold shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Publishing…" : "Publish Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
