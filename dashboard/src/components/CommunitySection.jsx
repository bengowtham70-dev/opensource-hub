import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Tag as TagIcon, Plus, Copy, Check, Send, CircleAlert } from "lucide-react";
import { api } from "../lib/api";
import { useCommunity } from "../stores/community";

// TODO: replace with the real repository after GitHub publish (same as trust appeals).
const FEEDBACK_REPO = "opensource-hub/opensource-hub";
const TAG_RE = /^[a-z0-9][a-z0-9-]{1,23}$/;

function issueUrl(kind, repo) {
  const title =
    kind === "suggestion"
      ? `[Suggestion] ${repo}`
      : `[Data report] ${repo} — something above is wrong`;
  const body =
    kind === "suggestion"
      ? encodeURIComponent(
          `## Suggestion for ${repo}\n\n**What would make this listing better?**\n\n\n_From the OpenSource Hub dashboard._`
        )
      : encodeURIComponent(
          `## Data report for ${repo}\n\n**What's wrong?** (feature-parity claim, savings estimate, tags…)\n\n\n**Correct info:**\n\n_From the OpenSource Hub dashboard._`
        );
  return `https://github.com/${FEEDBACK_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${body}`;
}

// PRD §34 — local-first community layer: votes, crowd tags, and feedback that
// composes GitHub issue deep links so nothing is ever sent to a server of ours.
export default function CommunitySection({ repo }) {
  const community = useCommunity();
  const [counts, setCounts] = useState({ votes: { yes: 0, no: 0 }, tags: {} });
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .communityGet(...repo.split("/"))
      .then((d) => alive && setCounts(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [repo]);

  const my = community.myVote(repo);

  const onVote = async (choice) => {
    setBusy(true);
    try {
      const updated = await community.vote(repo, choice);
      if (updated?.votes) setCounts((c) => ({ ...c, votes: updated.votes }));
    } catch {
      /* revert already handled in the store */
    } finally {
      setBusy(false);
    }
  };

  const onAddTag = async (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!TAG_RE.test(tag)) {
      setTagError("2–24 chars: lowercase letters, numbers, dashes.");
      return;
    }
    setTagError(null);
    try {
      const updated = await api.communityTag(repo, tag);
      setCounts((c) => ({ ...c, tags: updated.tags || c.tags }));
      setTagInput("");
    } catch (err) {
      setTagError(err.message);
    }
  };

  const copy = async (kind) => {
    try {
      await navigator.clipboard.writeText(issueUrl(kind, repo));
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard denied — the visible links still work */
    }
  };

  const topTags = Object.entries(counts.tags || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12);

  return (
    <section className="mt-6 card-glass p-6" aria-label="Community verdict">
      <h2 className="font-display text-display-md mb-4">Community verdict</h2>

      {/* Yes / No votes (PRD §34) */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onVote("yes")}
          disabled={busy}
          aria-pressed={my === "yes"}
          className={`btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-full border font-semibold ${
            my === "yes"
              ? "bg-trust/15 border-trust/50 text-trust"
              : "border-line text-dim hover:text-trust hover:border-trust/30"
          }`}
        >
          <ThumbsUp size={16} fill={my === "yes" ? "currentColor" : "none"} />
          Works for me
          <span className="tnum text-[13px] opacity-80 tabular-nums">{counts.votes.yes}</span>
        </button>
        <button
          type="button"
          onClick={() => onVote("no")}
          disabled={busy}
          aria-pressed={my === "no"}
          className={`btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-full border font-semibold ${
            my === "no"
              ? "bg-caution/15 border-caution/50 text-caution"
              : "border-line text-dim hover:text-caution hover:border-caution/30"
          }`}
        >
          <ThumbsDown size={16} fill={my === "no" ? "currentColor" : "none"} />
          Didn't work
          <span className="tnum text-[13px] opacity-80 tabular-nums">{counts.votes.no}</span>
        </button>
        <span className="text-[12px] text-faint">Stored locally · votes stay on this machine</span>
      </div>

      {/* Crowd tags */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {topTags.map(([tag, n]) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-tech/25 bg-tech/5 text-tech text-[12px] tnum"
              title={`${n} vote${n === 1 ? "" : "s"}`}
            >
              <TagIcon size={11} /> {tag}
              {n > 1 && <span className="opacity-60">{n}</span>}
            </span>
          ))}
          {topTags.length === 0 && (
            <span className="text-[12.5px] text-faint">No crowd tags yet — add the first one.</span>
          )}
        </div>
        <form onSubmit={onAddTag} className="mt-2.5 flex items-center gap-2 max-w-[380px]">
          <div className="relative flex-1">
            <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagError(null);
              }}
              placeholder="add a tag — e.g. self-host"
              aria-label="Add a crowd tag"
              className="w-full card-glass !bg-elevated pl-8 pr-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none focus:border-primary/50"
            />
          </div>
          <button type="submit" className="shimmer-button btn-tactile px-3.5 py-2 text-[13px] text-ink">
            Add
          </button>
        </form>
        {tagError && (
          <p className="mt-1.5 text-[12px] text-caution tnum" role="alert">
            ⚠ {tagError}
          </p>
        )}
      </div>

      {/* Feedback — GitHub issue deep links with copy fallback (PRD §34) */}
      <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="inline-flex items-center gap-2">
          <a
            href={issueUrl("suggestion", repo)}
            target="_blank"
            rel="noreferrer"
            className="btn-tactile inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-ink"
          >
            <Send size={13} /> Send suggestion
          </a>
          <button
            type="button"
            onClick={() => copy("suggestion")}
            aria-label="Copy suggestion link"
            className="btn-tactile text-faint hover:text-dim"
          >
            {copied === "suggestion" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
          </button>
        </span>
        <span className="inline-flex items-center gap-2">
          <a
            href={issueUrl("report", repo)}
            target="_blank"
            rel="noreferrer"
            className="btn-tactile inline-flex items-center gap-1.5 text-[13px] text-caution/90 hover:text-caution"
          >
            <CircleAlert size={13} /> Report wrong data
          </a>
          <button
            type="button"
            onClick={() => copy("report")}
            aria-label="Copy report link"
            className="btn-tactile text-faint hover:text-dim"
          >
            {copied === "report" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
          </button>
        </span>
      </div>
    </section>
  );
}
