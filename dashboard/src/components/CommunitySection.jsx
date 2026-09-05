import { useEffect, useState } from "react";
import { Tag as TagIcon, Plus, Copy, Check, Send, CircleAlert, Flag, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import ParityVotingWidget from "./ParityVotingWidget";
import ReportIssueModal from "./ReportIssueModal";

const SUGGESTED_TAXONOMY_TAGS = [
  "privacy-focused",
  "docker-ready",
  "offline-first",
  "crdt",
  "single-binary",
  "lightweight",
  "enterprise-ready",
  "drop-in-replacement",
];

function issueUrl(type, repo) {
  const base = "https://github.com/bengowtham70-dev/opensource-hub/issues/new";
  if (type === "suggestion") {
    const title = encodeURIComponent(`[Alternative Request] Suggestion for ${repo}`);
    const body = encodeURIComponent(
      `### Repo\n${repo}\n\n### Suggested alternative / correction\n<!-- describe your suggestion -->\n\n### Why?\n`
    );
    return `${base}?title=${title}&body=${body}&labels=community,alternative-request`;
  }
  const title = encodeURIComponent(`[Data Dispute] Accuracy issue on ${repo}`);
  const body = encodeURIComponent(
    `### Repo\n${repo}\n\n### Inaccurate fields\n- [ ] Pricing\n- [ ] Self-host guide\n- [ ] Commercial license\n- [ ] Alternatives list\n\n### Details\n`
  );
  return `${base}?title=${title}&body=${body}&labels=community,data-dispute`;
}

export default function CommunitySection({ repo = "", name = "", replaces = "" }) {
  const [counts, setCounts] = useState({ votes: { yes: 0, no: 0 }, tags: {} });
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const copy = async (type) => {
    try {
      await navigator.clipboard.writeText(issueUrl(type, repo));
      setCopied(type);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };

  const fetchCommunity = async () => {
    if (!repo || !repo.includes("/")) return;
    try {
      const [owner, repoName] = repo.split("/");
      const d = await api.communityGet(owner, repoName);
      if (d) setCounts(d);
    } catch {}
  };

  useEffect(() => {
    fetchCommunity();
  }, [repo]);

  const onAddTag = async (rawTag) => {
    const tag = String(rawTag || "").trim().toLowerCase().replace(/\s+/g, "-");
    const TAG_RE = /^[a-z0-9][a-z0-9-]{1,23}$/;
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

  const topTags = Object.entries(counts.tags || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 16);

  return (
    <section className="space-y-6 animate-fade-in" aria-label="Community verdict and contributions">
      {/* 3-Tier Parity Suitability Consensus Widget */}
      <ParityVotingWidget
        repo={repo}
        name={name}
        replaces={replaces}
      />

      {/* Crowd Tags Section */}
      <div className="card-elevated p-5 md:p-6 rounded-2xl bg-surface border border-line space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <TagIcon size={16} className="text-ember" />
            <h4 className="font-display text-sm font-bold text-ink">Crowd Tags &amp; Community Architecture Labels</h4>
          </div>
          <span className="text-[11px] text-faint">Click any tag to upvote (+1)</span>
        </div>

        {/* Existing Voted Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {topTags.map(([tag, n]) => (
            <button
              key={tag}
              type="button"
              onClick={() => onAddTag(tag)}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-elevated hover:border-ember/40 hover:text-ember text-ink text-xs tnum cursor-pointer transition-all shadow-xs"
              title={`Click to upvote '${tag}' (+1)`}
            >
              <TagIcon size={11} className="text-faint" />
              <span>{tag}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-surface text-dim text-[10.5px] font-bold border border-line/60">
                {n}
              </span>
            </button>
          ))}
          {topTags.length === 0 && (
            <span className="text-xs text-faint">No crowd tags voted yet. Choose from suggested tags below or add your own!</span>
          )}
        </div>

        {/* Curated Suggested Tags Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-medium text-dim block">Suggested Community Tags:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SUGGESTED_TAXONOMY_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onAddTag(tag)}
                className="btn-tactile px-2.5 py-1 rounded-lg border border-dashed border-line text-[11px] text-dim hover:text-ink hover:border-line-heavy bg-surface cursor-pointer transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Tag Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddTag(tagInput);
          }}
          className="mt-3 flex items-center gap-2 max-w-md"
        >
          <div className="relative flex-1">
            <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagError(null);
              }}
              placeholder="add a tag — e.g. self-host, crdt, offline-first"
              aria-label="add a tag"
              className="w-full px-3 pl-8 py-2 rounded-xl border border-line bg-elevated text-xs text-ink placeholder:text-faint outline-none focus:border-ember"
            />
          </div>
          <button
            type="submit"
            className="btn-tactile px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer"
          >
            Add Tag
          </button>
        </form>
        {tagError && (
          <p className="text-xs text-rose-500 font-medium" role="alert">
            {tagError}
          </p>
        )}
      </div>

      {/* Accuracy Audit & Reporting Drawer (PRD §34 & §10) */}
      <div className="card-elevated p-4 rounded-2xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-dim">
          <CircleAlert size={16} className="text-amber-500 shrink-0" />
          <span>Notice something inaccurate about this listing's price, demo, or license?</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <a
              href={issueUrl("suggestion", repo)}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-elevated hover:text-ink text-dim text-xs font-semibold"
            >
              <Send size={13} /> Send suggestion
            </a>
            <button
              type="button"
              onClick={() => copy("suggestion")}
              aria-label="Copy suggestion link"
              className="btn-tactile p-1.5 text-faint hover:text-dim cursor-pointer"
            >
              {copied === "suggestion" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
            </button>
          </span>

          <span className="inline-flex items-center gap-1">
            <a
              href={issueUrl("report", repo)}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 text-xs font-semibold"
            >
              <CircleAlert size={13} /> Report wrong data
            </a>
            <button
              type="button"
              onClick={() => copy("report")}
              aria-label="Copy report link"
              className="btn-tactile p-1.5 text-faint hover:text-dim cursor-pointer"
            >
              {copied === "report" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
            </button>
          </span>

          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold cursor-pointer ml-1"
          >
            <Flag size={13} />
            <span>Quick In-App Modal</span>
          </button>
        </div>
      </div>

      <ReportIssueModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        repo={repo}
        name={name}
        replaces={replaces}
      />
    </section>
  );
}
