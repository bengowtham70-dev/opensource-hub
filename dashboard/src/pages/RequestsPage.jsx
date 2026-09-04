import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Search,
  Filter,
  ArrowUp,
  ExternalLink,
  CheckCircle2,
  Clock,
  Plus,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";
import SuggestModal from "../components/SuggestModal";

export default function RequestsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [votedIds, setVotedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("osh_voted_suggestions") || "[]"));
    } catch {
      return new Set();
    }
  });

  const fetchSuggestions = async () => {
    try {
      const res = await api.communitySuggestions({
        status: filterStatus,
        q: searchQuery,
      });
      if (res && Array.isArray(res.suggestions)) {
        setSuggestions(res.suggestions);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSuggestions();
  }, [filterStatus, searchQuery]);

  const handleUpvote = async (id) => {
    if (votedIds.has(id)) return;

    // Optimistic update
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, votes: (s.votes || 1) + 1 } : s))
    );
    const updatedVoted = new Set(votedIds).add(id);
    setVotedIds(updatedVoted);
    try {
      localStorage.setItem("osh_voted_suggestions", JSON.stringify([...updatedVoted]));
      await api.communitySuggestionUpvote(id);
    } catch {}
  };

  const categories = [
    "All",
    "Project Management",
    "Observability & APM",
    "Databases & Spreadsheets",
    "Automation & Workflows",
    "Analytics & Customer Data",
    "Video & Screen Recording",
  ];

  const filteredSuggestions = suggestions.filter((s) => {
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-8 space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-line">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-xs font-semibold text-ink shadow-sm">
            <Sparkles size={14} className="text-amber-500" />
            <span>PRD §34 Community Contribution Engine</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Community Alternative Requests
          </h1>
          <p className="text-sm text-dim leading-relaxed">
            Vote on requested open-source alternatives to steer our curation roadmap.
            Tools with the highest votes are prioritized for deep verification and seed catalog ingestion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSuggestModalOpen(true)}
          className="btn-tactile inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink font-semibold text-xs shadow-md shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Request an Alternative</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-elevated p-4 rounded-2xl bg-surface border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requested tools or proprietary targets..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-line bg-elevated text-xs text-ink placeholder:text-faint outline-none focus:border-ember"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Requests" },
            { id: "open", label: "Community Requested" },
            { id: "under-review", label: "Under Review" },
            { id: "seeded", label: "Seeded in Catalog" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterStatus === tab.id
                  ? "bg-ink text-surface dark:bg-surface dark:text-ink shadow-sm"
                  : "bg-surface text-dim border border-line hover:bg-elevated hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        <span className="text-faint shrink-0 font-medium">Filter category:</span>
        {categories.map((cat) => {
          const val = cat === "All" ? "all" : cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(val)}
              className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                filterCategory === val
                  ? "bg-ember/15 border-ember/40 text-ember"
                  : "bg-surface border-line text-dim hover:border-line-heavy hover:text-ink"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-elevated p-5 rounded-2xl bg-surface border border-line space-y-4">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="card-elevated p-12 rounded-2xl bg-surface border border-line text-center space-y-4 max-w-lg mx-auto">
          <div className="size-12 rounded-full bg-elevated grid place-items-center mx-auto text-faint">
            <Compass size={24} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">No requests match your filter</h3>
          <p className="text-xs text-dim">
            Can't find the proprietary software or open-source tool you want? Submit the first request!
          </p>
          <button
            type="button"
            onClick={() => setSuggestModalOpen(true)}
            className="btn-tactile px-4 py-2 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink font-semibold text-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Submit New Alternative Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuggestions.map((item) => {
            const hasVoted = votedIds.has(item.id);
            return (
              <div
                key={item.id}
                className="card-elevated p-5 rounded-2xl bg-surface border border-line shadow-sm hover:border-line-heavy flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Top badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md border border-line bg-elevated text-dim text-[11px] font-medium">
                      {item.category || "Developer Tools"}
                    </span>

                    {item.status === "seeded" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-trust/30 bg-trust/10 text-trust text-[10.5px] font-semibold">
                        <CheckCircle2 size={12} />
                        <span>Seeded in Catalog</span>
                      </span>
                    ) : item.status === "under-review" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10.5px] font-semibold">
                        <Clock size={12} />
                        <span>Under Review</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-line bg-elevated text-faint text-[10.5px] font-medium">
                        <span>Community Requested</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Target */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink hover:text-ember transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-dim mt-0.5">
                      <span>Replaces</span>
                      <span className="font-semibold text-ink px-1.5 py-0.5 rounded bg-elevated border border-line">
                        {item.replaces || "Commercial SaaS"}
                      </span>
                    </div>
                  </div>

                  {/* Note / Description */}
                  <p className="text-xs text-dim line-clamp-3 leading-relaxed">
                    {item.note || "Proposed open-source candidate with modern feature parity."}
                  </p>

                  {/* Upstream Link */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ember hover:underline"
                    >
                      <span>Inspect Candidate Code</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Bottom Action Row: Upvote & Deep Link */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
                  {/* Upvote Button */}
                  <button
                    type="button"
                    onClick={() => handleUpvote(item.id)}
                    disabled={hasVoted}
                    title={hasVoted ? "You have already upvoted this request" : "Upvote this request"}
                    className={`btn-tactile inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      hasVoted
                        ? "bg-trust/10 border-trust/40 text-trust"
                        : "bg-elevated border-line text-ink hover:border-trust/40 hover:text-trust"
                    }`}
                  >
                    <ArrowUp size={14} className={hasVoted ? "stroke-[2.5]" : ""} />
                    <span className="tnum font-bold">{item.votes || 1}</span>
                    <span className="text-[11px] font-normal">{hasVoted ? "Upvoted" : "Upvote"}</span>
                  </button>

                  {/* If seeded, link to live catalog page */}
                  {item.seededRepo ? (
                    <Link
                      to={`/repo/${item.seededRepo}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold hover:opacity-90 shadow-sm"
                    >
                      <span>View in Catalog</span>
                      <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <span className="text-[11px] text-faint">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggest Modal Dialog */}
      <SuggestModal
        open={suggestModalOpen}
        onClose={() => {
          setSuggestModalOpen(false);
          fetchSuggestions();
        }}
      />
    </div>
  );
}
