import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Mail,
  Check,
  Rss,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Markdown from "../lib/markdown";

export default function NewsletterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const [copiedRss, setCopiedRss] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Fetch list of issues and subscriber count
  useEffect(() => {
    fetch("/api/newsletter/issues")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.issues)) {
          setIssues(data.issues);
        }
      })
      .catch(() => {});

    fetch("/api/newsletter/subscribers")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && typeof data.count === "number") {
          setSubscriberCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

  const currentIssueId = searchParams.get("issue");

  // Fetch selected issue details
  useEffect(() => {
    if (!currentIssueId) {
      setSelectedIssue(null);
      return;
    }
    setLoadingIssue(true);
    fetch(`/api/newsletter/issues/${currentIssueId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.issue) {
          setSelectedIssue(data.issue);
        }
      })
      .catch(() => setSelectedIssue(null))
      .finally(() => setLoadingIssue(false));
  }, [currentIssueId]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setSubscribeStatus(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "newsletter-page" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Subscription failed. Please try again.");
      }
      setSubscribeStatus({ ok: true, message: data.message });
      setEmail("");
      // Refresh count
      fetch("/api/newsletter/subscribers")
        .then((r) => r.json())
        .then((d) => d?.count && setSubscriberCount(d.count))
        .catch(() => {});
    } catch (err) {
      setSubscribeStatus({ ok: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openIssue = (id) => {
    setSearchParams({ issue: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToArchive = () => {
    setSelectedIssue(null);
    setSearchParams({});
  };

  const copyRssUrl = async (url) => {
    const full = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(full);
      setCopiedRss(true);
      setTimeout(() => setCopiedRss(false), 2000);
    } catch {}
  };

  const copyShareIssue = async () => {
    const full = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(full);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-10 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-faint" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <span className="text-ink font-medium">Newsletter</span>
        {selectedIssue && (
          <>
            <span>/</span>
            <span className="text-dim truncate max-w-[200px]">{selectedIssue.title}</span>
          </>
        )}
      </nav>

      {/* Header Banner */}
      {!selectedIssue && (
        <div className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-xs font-semibold text-ember shadow-2xs">
              <Sparkles size={13} />
              <span>Weekly Open-Source Intelligence</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink tracking-tight">
              OpenSource Hub Weekly Digest
            </h1>
            <p className="text-sm sm:text-base text-dim leading-relaxed">
              Every Tuesday, we analyze thousands of active GitHub repositories to deliver the fastest-rising open-source alternatives, real-world migration guides, and self-hosted cost-cutting blueprints.
            </p>
          </div>

          {/* Subscribe Box */}
          <div className="card-elevated p-6 sm:p-8 bg-surface border border-line rounded-2xl max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base text-ink flex items-center gap-2">
                <Mail size={18} className="text-ember" />
                <span>Get the Weekly Briefing</span>
              </h2>
              {subscriberCount !== null && (
                <span className="text-xs text-trust-strong font-medium px-2.5 py-1 rounded-full bg-trust/10 border border-trust/20 tnum">
                  {subscriberCount > 0 ? `${subscriberCount.toLocaleString()} Subscribers` : "Free Forever"}
                </span>
              )}
            </div>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-line bg-elevated text-ink placeholder:text-faint focus:border-ember outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-tactile px-5 py-2.5 rounded-xl bg-ink text-surface dark:bg-surface dark:text-ink text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Subscribing…" : "Subscribe Free"}
                <ArrowRight size={13} />
              </button>
            </form>

            {subscribeStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  subscribeStatus.ok
                    ? "bg-trust/10 border-trust/30 text-trust-strong"
                    : "bg-caution/10 border-caution/30 text-caution"
                }`}
              >
                {subscribeStatus.ok ? <Check size={15} /> : <AlertCircle size={15} />}
                <span>{subscribeStatus.message}</span>
              </div>
            )}

            <p className="text-[11.5px] text-faint">
              🔒 Zero spam. No tracking pixels or affiliate sponsorships. Unsubscribe in one click anytime.
            </p>
          </div>

          {/* RSS Feeds & Syndication Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            <div className="p-4 rounded-xl border border-line bg-elevated/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                  <Rss size={15} className="text-ember" />
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-ink block truncate">Tool Releases RSS</span>
                  <span className="text-[11px] text-faint block truncate">Live feed of vetted tools</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyRssUrl("/rss/tools.xml")}
                className="btn-tactile text-xs px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-elevated text-dim hover:text-ink shrink-0"
              >
                {copiedRss ? "Copied URL!" : "Copy RSS"}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-line bg-elevated/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="size-8 rounded-lg bg-surface border border-line grid place-items-center shrink-0">
                  <BookOpen size={15} className="text-link" />
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-ink block truncate">Articles &amp; Guides RSS</span>
                  <span className="text-[11px] text-faint block truncate">Editorial publications feed</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyRssUrl("/rss/posts.xml")}
                className="btn-tactile text-xs px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-elevated text-dim hover:text-ink shrink-0"
              >
                Copy RSS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Selected Issue */}
      {selectedIssue && (
        <article className="space-y-6 max-w-3xl animate-card-in">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <button
              type="button"
              onClick={backToArchive}
              className="btn-tactile text-xs font-medium text-dim hover:text-ink inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back to all editions</span>
            </button>

            <button
              type="button"
              onClick={copyShareIssue}
              className="btn-tactile text-xs px-3 py-1.5 rounded-lg border border-line bg-surface text-dim hover:text-ink inline-flex items-center gap-1.5"
            >
              {copiedShare ? <Check size={13} className="text-trust" /> : <Share2 size={13} />}
              <span>{copiedShare ? "Link Copied!" : "Share Edition"}</span>
            </button>
          </div>

          <div className="card-elevated p-8 bg-surface border border-line rounded-2xl space-y-6">
            <div className="space-y-2 border-b border-line pb-6">
              <div className="flex items-center gap-2 text-xs text-faint">
                <span className="px-2 py-0.5 rounded-full bg-elevated border border-line font-mono uppercase text-[11px]">
                  {selectedIssue.week}
                </span>
                {selectedIssue.date && (
                  <span className="inline-flex items-center gap-1 tnum">
                    <Calendar size={12} /> {selectedIssue.date}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
                {selectedIssue.title}
              </h1>
            </div>

            {loadingIssue ? (
              <div className="space-y-4">
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-20 w-full rounded-xl" />
                <div className="skeleton h-20 w-full rounded-xl" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-dim leading-relaxed">
                <Markdown source={selectedIssue.markdown} />
              </div>
            )}
          </div>
        </article>
      )}

      {/* Past Issues Archive Grid */}
      {!selectedIssue && (
        <section className="space-y-4 pt-6 border-t border-line" aria-label="Weekly Digest Archive">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">
              Past Weekly Editions
            </h2>
            <span className="text-xs text-faint tnum">{issues.length} Editions Available</span>
          </div>

          {issues.length === 0 ? (
            <div className="card-elevated p-8 text-center text-dim text-sm border-dashed">
              Compiling the latest weekly digest…
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => openIssue(issue.id)}
                  className="card-elevated p-5 bg-surface border border-line rounded-xl hover:border-ink/30 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-faint">
                      <span className="px-2 py-0.5 rounded-full bg-elevated border border-line font-mono text-[11px]">
                        {issue.week}
                      </span>
                      {issue.date && (
                        <span className="inline-flex items-center gap-1 tnum text-[11px]">
                          <Calendar size={11} /> {issue.date}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink group-hover:text-link transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-dim line-clamp-3 leading-relaxed">
                      {issue.snippet || "Weekly curated analysis of rising open-source tools and cost-cutting replacements."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-link font-medium">
                    <span>Read Issue</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
