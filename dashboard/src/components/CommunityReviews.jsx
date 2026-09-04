import { useState, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  MessageSquarePlus,
  X,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ShieldCheck,
  Send,
} from "lucide-react";
import { api } from "../lib/api";

const ENV_PRESETS = [
  "Docker Compose on VPS",
  "Raspberry Pi 4 / 5",
  "Kubernetes (K8s)",
  "Unraid / TrueNAS / Proxmox",
  "Local Desktop / Bare Metal",
  "Cloud VM (AWS/Hetzner/DigitalOcean)",
];

export default function CommunityReviews({ owner, name, repoName }) {
  const repoFullName = `${owner}/${name}`;
  const [data, setData] = useState({ reviews: [], total: 0, averageRating: 5.0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [votedHelpful, setVotedHelpful] = useState({});

  // Form State
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [environment, setEnvironment] = useState("Docker Compose on VPS");
  const [switchedFrom, setSwitchedFrom] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [prosText, setProsText] = useState("");
  const [consText, setConsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getReviews(owner, name)
      .then((res) => {
        if (alive && res) {
          setData(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [owner, name]);

  const handleVoteHelpful = async (reviewId) => {
    if (votedHelpful[reviewId]) return;

    setVotedHelpful((prev) => ({ ...prev, [reviewId]: true }));
    setData((prev) => ({
      ...prev,
      reviews: prev.reviews.map((r) =>
        r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r
      ),
    }));

    try {
      await api.voteReviewHelpful(owner, name, reviewId);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !summary.trim()) return;

    setSubmitting(true);
    try {
      const pros = prosText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const cons = consText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await api.addReview(owner, name, {
        rating,
        author: author.trim() || "Anonymous Self-Hoster",
        role: role.trim() || environment,
        environment,
        switchedFrom: switchedFrom.trim(),
        summary: summary.trim() || content.trim().slice(0, 80),
        content: content.trim(),
        pros,
        cons,
      });

      if (res) {
        setData(res);
      }
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSubmitSuccess(false);
        setSummary("");
        setContent("");
        setProsText("");
        setConsText("");
      }, 1200);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const allPros = [...new Set(data.reviews.flatMap((r) => r.pros || []))].slice(0, 6);
  const allCons = [...new Set(data.reviews.flatMap((r) => r.cons || []))].slice(0, 6);

  return (
    <section className="space-y-6 pt-4 border-t border-line">
      {/* Header & Overall Sentiment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-ink">
              Community Reviews &amp; Hosting Feedback
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-elevated border border-line text-dim tnum">
              {data.total} {data.total === 1 ? "review" : "reviews"}
            </span>
          </div>
          <p className="text-sm text-dim mt-1">
            Real-world self-hosting experiences, stability reports, and deployment watchouts from verified engineers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-tactile px-4 py-2 rounded-lg bg-ink text-surface text-xs font-semibold inline-flex items-center gap-2 self-start md:self-auto hover:opacity-90 shadow-xs"
        >
          <MessageSquarePlus size={14} />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface rounded-2xl border border-line p-5 shadow-sm">
        {/* Rating Score */}
        <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-line pb-4 md:pb-0 md:pr-4">
          <div className="text-4xl font-extrabold font-display text-ink tnum">
            {data.averageRating > 0 ? data.averageRating.toFixed(1) : "5.0"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= Math.round(data.averageRating || 5) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="text-xs text-faint">
              Based on {data.total} self-hoster submissions
            </p>
          </div>
        </div>

        {/* Top Pros Summary */}
        <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-line pb-4 md:pb-0 md:pr-4">
          <span className="text-xs font-semibold text-trust inline-flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Top Community Strengths</span>
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allPros.length > 0 ? (
              allPros.map((pro, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-trust/10 text-trust border border-trust/20"
                >
                  {pro}
                </span>
              ))
            ) : (
              <span className="text-xs text-faint">No strengths highlighted yet</span>
            )}
          </div>
        </div>

        {/* Top Watchouts Summary */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
            <AlertTriangle size={12} />
            <span>Deployment Watchouts</span>
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allCons.length > 0 ? (
              allCons.map((con, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                >
                  {con}
                </span>
              ))
            ) : (
              <span className="text-xs text-faint">No major caveats reported</span>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Stream */}
      <div className="space-y-3">
        {data.reviews && data.reviews.length > 0 ? (
          data.reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-surface rounded-xl border border-line p-4 space-y-3 transition-colors hover:border-line-strong"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-ink">{rev.author}</span>
                  {rev.role && (
                    <span className="text-xs text-dim">· {rev.role}</span>
                  )}
                  {rev.switchedFrom && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-ember/10 text-ember border border-ember/20">
                      Switched from {rev.switchedFrom}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-faint">
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        fill={s <= rev.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span>·</span>
                  <span className="tnum">
                    {new Date(rev.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Title & Comment */}
              <div className="space-y-1">
                {rev.summary && (
                  <h3 className="font-bold text-sm text-ink">{rev.summary}</h3>
                )}
                <p className="text-xs text-dim leading-relaxed whitespace-pre-line">
                  {rev.content}
                </p>
              </div>

              {/* Pros & Cons tags */}
              {((rev.pros && rev.pros.length > 0) || (rev.cons && rev.cons.length > 0)) && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {rev.pros?.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] text-trust"
                    >
                      <CheckCircle2 size={11} />
                      <span>{p}</span>
                    </span>
                  ))}
                  {rev.cons?.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400"
                    >
                      <AlertTriangle size={11} />
                      <span>{c}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Footer: Helpful Vote */}
              <div className="flex items-center justify-between pt-2 border-t border-line/40 text-xs">
                <span className="text-[11px] text-faint inline-flex items-center gap-1">
                  <Server size={11} />
                  <span>Deployment Environment: {rev.role || "Docker"}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id)}
                  disabled={votedHelpful[rev.id]}
                  className={`btn-tactile px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors ${
                    votedHelpful[rev.id]
                      ? "bg-trust/10 text-trust border border-trust/20"
                      : "bg-elevated hover:bg-elevated/80 text-dim border border-line"
                  }`}
                  title="Mark this review as helpful"
                >
                  <ThumbsUp size={11} />
                  <span>Helpful ({rev.helpful || 0})</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center border border-line rounded-xl bg-elevated/40 space-y-2">
            <p className="text-xs text-dim">
              No reviews written yet for {repoName || name}.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold text-link hover:underline inline-flex items-center gap-1"
            >
              <span>Be the first to share your self-hosted review</span>
            </button>
          </div>
        )}
      </div>

      {/* Review Submission Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-surface border border-line rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 id="review-dialog-title" className="font-display text-lg font-bold text-ink">
                  Write a Self-Hosted Review
                </h3>
                <p className="text-xs text-dim">
                  Share your production hosting experience for {repoFullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md text-faint hover:text-ink hover:bg-elevated transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2 text-trust">
                <CheckCircle2 size={32} className="mx-auto" />
                <h4 className="font-bold text-sm">Review Submitted!</h4>
                <p className="text-xs text-dim">
                  Thank you for contributing to open-source transparency.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Rating Selector */}
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Overall Rating:
                  </label>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={20}
                          fill={star <= rating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono text-ink font-semibold tnum">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {/* Name & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-dim mb-1">
                      Your Name:
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Alex K."
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-dim mb-1">
                      Switched From (Optional):
                    </label>
                    <input
                      type="text"
                      value={switchedFrom}
                      onChange={(e) => setSwitchedFrom(e.target.value)}
                      placeholder="e.g. Firebase, Slack"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Environment Dropdown */}
                <div>
                  <label className="block font-medium text-dim mb-1">
                    Deployment Environment:
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => {
                      setEnvironment(e.target.value);
                      setRole(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden"
                  >
                    {ENV_PRESETS.map((env) => (
                      <option key={env} value={env}>
                        {env}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Summary */}
                <div>
                  <label className="block font-medium text-dim mb-1">
                    Headline / Summary:
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="e.g. Rock solid PostgreSQL platform with instant auth"
                    className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden"
                  />
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-trust mb-1">
                      Pros (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={prosText}
                      onChange={(e) => setProsText(e.target.value)}
                      placeholder="e.g. Low RAM, native SQLite"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-amber-600 dark:text-amber-400 mb-1">
                      Cons / Watchouts:
                    </label>
                    <input
                      type="text"
                      value={consText}
                      onChange={(e) => setConsText(e.target.value)}
                      placeholder="e.g. Needs SSL proxy"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block font-medium text-dim mb-1">
                    Detailed Experience:
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe stability, memory footprint, migration ease, and advice for other self-hosters..."
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-ink focus:border-ink focus:outline-hidden resize-none"
                    required
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs text-dim hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-tactile px-4 py-1.5 rounded-lg bg-ink text-surface text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90"
                  >
                    <Send size={12} />
                    <span>{submitting ? "Submitting..." : "Submit Review"}</span>
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
