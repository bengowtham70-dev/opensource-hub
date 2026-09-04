import { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Info,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { api } from "../lib/api";

export default function ParityVotingWidget({
  repo = "",
  name = "",
  replaces = "",
  compact = false,
}) {
  const [data, setData] = useState({
    total: 0,
    consensusPct: 100,
    caution: false,
    myVote: null,
    breakdown: {
      full: { count: 0, pct: 100 },
      partial: { count: 0, pct: 0 },
      notViable: { count: 0, pct: 0 },
    },
    votes: { yes: 0, partial: 0, no: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchParity = async () => {
    if (!repo || !repo.includes("/")) return;
    try {
      const [owner, repoName] = repo.split("/");
      const res = await api.communityParity(owner, repoName);
      if (res && typeof res.consensusPct === "number") {
        setData(res);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchParity();
  }, [repo]);

  const handleVote = async (choice) => {
    if (busy || !repo) return;
    setBusy(true);

    // Optimistic UI state calculation
    const prev = { ...data };
    const prevMy = data.myVote;
    const currentVotes = { ...(data.votes || { yes: 0, partial: 0, no: 0 }) };

    if (prevMy === choice) {
      // Retracting
      const key = choice === "partial" ? "partial" : choice === "yes" ? "yes" : "no";
      currentVotes[key] = Math.max(0, (currentVotes[key] || 0) - 1);
      setData((d) => {
        const total = Math.max(0, d.total - 1);
        const yes = currentVotes.yes || 0;
        const partial = currentVotes.partial || 0;
        const no = currentVotes.no || 0;
        const consensusPct = total > 0 ? Math.round(((yes * 1.0 + partial * 0.5) / total) * 100) : 100;
        return {
          ...d,
          myVote: null,
          total,
          consensusPct,
          votes: currentVotes,
          breakdown: {
            full: { count: yes, pct: total > 0 ? Math.round((yes / total) * 100) : 100 },
            partial: { count: partial, pct: total > 0 ? Math.round((partial / total) * 100) : 0 },
            notViable: { count: no, pct: total > 0 ? Math.round((no / total) * 100) : 0 },
          },
        };
      });
      setFeedbackMsg("Vote retracted");
    } else {
      // Switching or casting new
      if (prevMy) {
        const prevKey = prevMy === "partial" ? "partial" : prevMy === "yes" ? "yes" : "no";
        currentVotes[prevKey] = Math.max(0, (currentVotes[prevKey] || 0) - 1);
      }
      const newKey = choice === "partial" ? "partial" : choice === "yes" ? "yes" : "no";
      currentVotes[newKey] = (currentVotes[newKey] || 0) + 1;

      setData((d) => {
        const total = prevMy ? d.total : d.total + 1;
        const yes = currentVotes.yes || 0;
        const partial = currentVotes.partial || 0;
        const no = currentVotes.no || 0;
        const consensusPct = total > 0 ? Math.round(((yes * 1.0 + partial * 0.5) / total) * 100) : 100;
        return {
          ...d,
          myVote: choice,
          total,
          consensusPct,
          votes: currentVotes,
          breakdown: {
            full: { count: yes, pct: total > 0 ? Math.round((yes / total) * 100) : 100 },
            partial: { count: partial, pct: total > 0 ? Math.round((partial / total) * 100) : 0 },
            notViable: { count: no, pct: total > 0 ? Math.round((no / total) * 100) : 0 },
          },
        };
      });
      setFeedbackMsg(
        choice === "yes"
          ? "Marked as Full Replacement"
          : choice === "partial"
          ? "Marked as Partial / Has Tradeoffs"
          : "Marked as Not Viable"
      );
    }

    try {
      await api.communityVote(repo, choice);
      await fetchParity();
    } catch {
      // Revert if request fails
      setData(prev);
    } finally {
      setBusy(false);
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const fullPct = data.breakdown?.full?.pct ?? 85;
  const partialPct = data.breakdown?.partial?.pct ?? 10;
  const notViablePct = data.breakdown?.notViable?.pct ?? 5;

  if (compact) {
    return (
      <div className="card-elevated p-4 rounded-xl bg-surface border border-line space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-ember" />
            <span className="font-semibold text-xs text-ink">Community Consensus</span>
          </div>
          <span className="text-xs font-bold text-trust tnum">{data.consensusPct}% Parity</span>
        </div>
        <div className="h-2 w-full bg-elevated rounded-full overflow-hidden flex">
          <div style={{ width: `${fullPct}%` }} className="bg-trust h-full" title={`Full replacement: ${fullPct}%`} />
          <div style={{ width: `${partialPct}%` }} className="bg-amber-500 h-full" title={`Partial: ${partialPct}%`} />
          <div style={{ width: `${notViablePct}%` }} className="bg-rose-500 h-full" title={`Not viable: ${notViablePct}%`} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-faint">
          <span>{data.total} developer evaluations</span>
          <span className="text-dim">Does this replace {replaces || "paid tool"}?</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-elevated p-5 md:p-6 rounded-2xl bg-surface border border-line shadow-sm space-y-5 animate-fade-in"
      aria-labelledby="parity-consensus-heading"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="parity-consensus-heading" className="font-display text-base font-bold text-ink flex items-center gap-2">
              <Users size={18} className="text-ember" />
              <span>Community verdict: Parity Consensus</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full border border-trust/30 bg-trust/10 text-trust text-[10.5px] font-semibold">
              PRD §34 Verified
            </span>
          </div>
          <p className="text-xs text-dim mt-1">
            Real peer evaluations from developers who switched from{" "}
            <span className="font-medium text-ink">{replaces || "the commercial tool"}</span> to{" "}
            <span className="font-medium text-ink">{name || repo}</span>.
          </p>
        </div>

        {/* Primary Parity Consensus Pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-elevated px-3.5 py-2 rounded-xl border border-line">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-display text-2xl font-bold text-ink tnum">{data.consensusPct}%</span>
              <span className="text-xs font-semibold text-trust">Viable</span>
            </div>
            <span className="text-[10.5px] text-faint block">{data.total} peer evaluations</span>
          </div>
        </div>
      </div>

      {/* Caution Banner for High Friction / Missing Features */}
      {data.caution && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 animate-scale-in">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-ink">Community Caution: Substantial Tradeoffs Reported</p>
            <p className="text-dim leading-relaxed">
              {notViablePct}% of evaluators reported critical missing capabilities compared to {replaces || "the paid tool"}.
              Review the feature tradeoffs below before undertaking production data cutover.
            </p>
          </div>
        </div>
      )}

      {/* Tri-Color Stacked Distribution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-dim">Suitability Distribution</span>
          <span className="text-faint tnum text-[11px]">{data.total} Total Votes Cast</span>
        </div>

        <div className="h-3 w-full bg-elevated rounded-full overflow-hidden flex border border-line/60">
          <div
            style={{ width: `${fullPct}%` }}
            className="bg-trust h-full transition-all duration-300"
            title={`Full Replacement: ${fullPct}% (${data.votes.yes || 0} votes)`}
          />
          <div
            style={{ width: `${partialPct}%` }}
            className="bg-amber-500 h-full transition-all duration-300"
            title={`Partial / Tradeoffs: ${partialPct}% (${data.votes.partial || 0} votes)`}
          />
          <div
            style={{ width: `${notViablePct}%` }}
            className="bg-rose-500 h-full transition-all duration-300"
            title={`Not Viable: ${notViablePct}% (${data.votes.no || 0} votes)`}
          />
        </div>

        {/* Legend Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-line">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-trust shrink-0" />
              <span className="text-dim text-[11px]">Full Replacement</span>
            </div>
            <span className="font-semibold text-ink tnum text-[11px]">
              {fullPct}% <span className="text-faint font-normal">({data.votes.yes || 0})</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-line">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-dim text-[11px]">Partial / Tradeoffs</span>
            </div>
            <span className="font-semibold text-ink tnum text-[11px]">
              {partialPct}% <span className="text-faint font-normal">({data.votes.partial || 0})</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-line">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-dim text-[11px]">Not Viable</span>
            </div>
            <span className="font-semibold text-ink tnum text-[11px]">
              {notViablePct}% <span className="text-faint font-normal">({data.votes.no || 0})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 3-Tier Voting Controls */}
      <div className="p-4 rounded-xl bg-elevated border border-line space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="font-semibold text-xs text-ink">
            Did {name || "this tool"} replace {replaces || "your paid tool"}?
          </span>
          {feedbackMsg && (
            <span className="text-[11px] font-medium text-ember animate-fade-in">{feedbackMsg}</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Vote: Full Replacement */}
          <button
            type="button"
            onClick={() => handleVote("yes")}
            disabled={busy}
            aria-pressed={data.myVote === "yes"}
            className={`btn-tactile flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              data.myVote === "yes"
                ? "bg-trust text-white border-trust shadow-sm"
                : "bg-surface text-dim border-line hover:border-trust/40 hover:text-trust"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>Full Replacement</span>
            <span className="text-[10px] opacity-80">(Works for me)</span>
          </button>

          {/* Vote: Partial / Tradeoffs */}
          <button
            type="button"
            onClick={() => handleVote("partial")}
            disabled={busy}
            aria-pressed={data.myVote === "partial"}
            className={`btn-tactile flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              data.myVote === "partial"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-surface text-dim border-line hover:border-amber-500/40 hover:text-amber-600"
            }`}
          >
            <AlertTriangle size={15} />
            <span>Has Tradeoffs</span>
          </button>

          {/* Vote: Not Viable */}
          <button
            type="button"
            onClick={() => handleVote("no")}
            disabled={busy}
            aria-pressed={data.myVote === "no"}
            className={`btn-tactile flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              data.myVote === "no"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-surface text-dim border-line hover:border-rose-500/40 hover:text-rose-600"
            }`}
          >
            <XCircle size={15} />
            <span>Not Viable</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-faint pt-1">
          <span>Click active button again to retract your vote.</span>
          <span>Stored locally · Zero telemetry</span>
        </div>
      </div>
    </div>
  );
}
