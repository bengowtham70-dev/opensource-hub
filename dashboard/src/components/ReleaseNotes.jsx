import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, Rss, Copy, Check } from "lucide-react";
import { parseAtomFeed } from "../lib/releases";

// F10 — "What's New" per tool, rendered from GitHub's native releases feed
// (proxied + cached by /api/rss — no extra infrastructure, PRD §19 item 17, PRD §38).
export default function ReleaseNotes({ owner, name }) {
  const [entries, setEntries] = useState(null);
  const [failed, setFailed] = useState(false);
  const [copiedRss, setCopiedRss] = useState(false);

  const rssUrl = typeof window !== "undefined" ? `${window.location.origin}/api/rss/${owner}/${name}` : `/api/rss/${owner}/${name}`;

  const copyRss = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(rssUrl);
    setCopiedRss(true);
    setTimeout(() => setCopiedRss(false), 2000);
  };

  useEffect(() => {
    let alive = true;
    fetch(`/api/rss/${owner}/${name}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((xml) => {
        if (!alive) return;
        setEntries(parseAtomFeed(xml, 5));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [owner, name]);

  if (failed) return null; // no releases / feed unavailable — section simply doesn't exist
  if (!entries) {
    return (
      <section className="mt-6 card-elevated p-6" aria-label="Release notes">
        <h2 className="font-display text-display-md mb-3">What's new</h2>
        <div className="skeleton h-16 w-full" />
      </section>
    );
  }
  if (entries.length === 0) return null;

  return (
    <section className="mt-6 card-elevated p-6" aria-label="Release notes">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-display-md flex items-center gap-2.5">
          <Newspaper size={20} className="text-tech" /> What's new
        </h2>
        <button
          type="button"
          onClick={copyRss}
          className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim hover:text-ink hover:border-line-strong shadow-2xs transition-colors"
          title={`Copy RSS feed URL: /api/rss/${owner}/${name}`}
        >
          {copiedRss ? <Check size={12} className="text-trust" /> : <Rss size={12} className="text-accent" />}
          <span>{copiedRss ? "RSS Copied" : "RSS Feed"}</span>
        </button>
      </div>
      <div className="space-y-3">
        {entries.map((e, i) => (
          <a
            key={e.id || i}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="block p-3.5 rounded-xl border border-line bg-primary/5 hover:border-tech/35 transition-colors group animate-card-in"
            style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-[13.5px] text-ink group-hover:text-tech transition-colors truncate">
                {e.title}
              </span>
              <span className="shrink-0 tnum text-[11px] text-faint">
                {e.date ? new Date(e.date).toLocaleDateString() : ""}
                <ExternalLink size={11} className="inline ml-1.5 opacity-50" />
              </span>
            </div>
            {e.content && <p className="text-[12.5px] text-dim mt-1 leading-relaxed line-clamp-2">{e.content}</p>}
          </a>
        ))}
      </div>
    </section>
  );
}
