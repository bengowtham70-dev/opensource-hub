import { useEffect, useState } from "react";
import { ShieldCheck, Check, X, ExternalLink, Clock, Sparkles, Filter, AlertTriangle } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";

export default function AdminQueuePage() {
  const [queue, setQueue] = useState({ pending: [], processed: [], totalPending: 0, totalProcessed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/queue");
      if (res.ok) {
        const json = await res.json();
        setQueue(json);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/admin/approve/${id}`, { method: "POST" });
      if (res.ok) {
        setActionSuccess(`Approved candidate ${id}!`);
        setTimeout(() => setActionSuccess(null), 2500);
        fetchQueue();
      }
    } catch {}
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectId) return;
    try {
      const res = await fetch(`/api/admin/reject/${rejectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || "Did not meet open-source criteria" }),
      });
      if (res.ok) {
        setActionSuccess(`Rejected submission.`);
        setRejectId(null);
        setRejectReason("");
        setTimeout(() => setActionSuccess(null), 2500);
        fetchQueue();
      }
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 space-y-6">
      <Breadcrumbs
        trail={[
          { label: "Home", to: "/" },
          { label: "Admin Moderation" },
        ]}
      />

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink grid place-items-center shrink-0">
              <ShieldCheck size={20} className="text-trust" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Admin Submissions & Moderation Queue
              </h1>
              <p className="text-xs sm:text-sm text-dim mt-0.5">
                Review, verify licenses, and approve community tool submissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`btn-tactile px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              filter === "pending"
                ? "bg-ink text-surface dark:bg-surface dark:text-ink border-transparent shadow-xs"
                : "border-line bg-surface text-dim hover:text-ink"
            }`}
          >
            Pending ({queue.totalPending})
          </button>
          <button
            type="button"
            onClick={() => setFilter("processed")}
            className={`btn-tactile px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              filter === "processed"
                ? "bg-ink text-surface dark:bg-surface dark:text-ink border-transparent shadow-xs"
                : "border-line bg-surface text-dim hover:text-ink"
            }`}
          >
            Processed ({queue.totalProcessed})
          </button>
        </div>
      </header>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-trust/10 border border-trust/30 text-trust text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Queue List */}
      {filter === "pending" ? (
        queue.pending.length === 0 ? (
          <div className="card-elevated p-12 text-center rounded-2xl border border-dashed border-line space-y-2 bg-surface">
            <p className="text-sm font-semibold text-ink">No pending submissions in queue!</p>
            <p className="text-xs text-dim">All community submitted alternatives have been verified and processed.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {queue.pending.map((item) => (
              <div
                key={item.id}
                className="card-elevated p-5 rounded-2xl bg-surface border border-line space-y-3 hover:border-line-strong transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold text-ink">{item.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-elevated border border-line text-dim text-[11px] font-medium">
                        {item.category}
                      </span>
                    </div>
                    {item.replaces && (
                      <span className="text-xs text-faint block mt-0.5">
                        Proposed alternative to: <strong className="text-dim">{item.replaces}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-xs text-dim hover:text-ink inline-flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} />
                      <span>Inspect Repository</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectId(item.id);
                        setRejectReason("");
                      }}
                      className="btn-tactile px-3 py-1.5 rounded-lg border border-caution/40 text-caution hover:bg-caution/10 text-xs font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id)}
                      className="btn-tactile px-3.5 py-1.5 rounded-lg bg-trust text-white text-xs font-semibold inline-flex items-center gap-1 shadow-sm hover:opacity-90"
                    >
                      <Check size={14} />
                      <span>Approve to Catalog</span>
                    </button>
                  </div>
                </div>

                {item.note && (
                  <p className="text-xs text-dim bg-elevated p-3 rounded-xl border border-line leading-relaxed">
                    <strong className="text-ink">Submitter Note:</strong> {item.note}
                  </p>
                )}

                <div className="text-[11px] text-faint flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>Submitted {new Date(item.submittedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Processed List */
        queue.processed.length === 0 ? (
          <div className="card-elevated p-12 text-center rounded-2xl border border-dashed border-line text-dim text-xs bg-surface">
            No processed submission history yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {queue.processed.map((item) => (
              <div
                key={item.id}
                className="card-elevated p-4 rounded-xl bg-surface border border-line flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{item.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === "approved" ? "bg-trust/10 text-trust" : "bg-caution/10 text-caution"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.reason && <p className="text-faint text-[11px] mt-0.5">Reason: {item.reason}</p>}
                </div>

                <span className="text-faint text-[11px]">
                  {new Date(item.processedAt || item.submittedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setRejectId(null)}
        >
          <div
            className="card-elevated max-w-md w-full p-6 space-y-4 bg-surface text-ink border border-line shadow-2xl rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-base font-bold text-ink">Reject Tool Submission</h3>
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="p-1 rounded-md text-faint hover:text-ink hover:bg-elevated border border-line"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-dim font-medium mb-1">Reason for Rejection</label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Repository is unmaintained or uses non-OSI approved license."
                  className="w-full px-3 py-2 rounded-lg border border-line bg-elevated text-ink placeholder:text-faint outline-none focus:border-caution"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="btn-tactile px-3 py-1.5 rounded-lg border border-line text-dim font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile px-4 py-1.5 rounded-lg bg-caution text-white font-semibold shadow-sm hover:opacity-90"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
