import { useEffect, useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

// PRD parity P7 (plans/PLAN_PARITY.md) — share intents for a local-first app.
// The shareable public target is the project's GitHub repo; the dashboard URL
// is machine-local and useless to others, so we never share it.
const NETWORKS = [
  { label: "X", url: (u, t) => `https://twitter.com/intent/post?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { label: "Bluesky", url: (u, t) => `https://bsky.app/intent/compose?text=${encodeURIComponent(t + " " + u)}` },
  { label: "Mastodon", url: (u, t) => `https://mastodon.social/share?text=${encodeURIComponent(t + " " + u)}` },
  { label: "Reddit", url: (u, t) => `https://reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
  { label: "Hacker News", url: (u, t) => `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}` },
];

export default function ShareBar({ repo, name }) {
  const [copied, setCopied] = useState(false);
  const target = `https://github.com/${repo}`;
  const title = `${name} — free open-source alternative, found with OpenSource Hub`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key === "c" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target]);

  const chip =
    "btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full tnum text-[11px] border border-line text-dim hover:text-ink hover:border-line-strong transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={`Share ${name}`}>
      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-faint mr-0.5 font-medium select-none">
        <Share2 size={12} aria-hidden /> Share
      </span>
      <button type="button" onClick={copy} className={`${chip} ${copied ? "border-trust/40 text-trust" : ""}`}>
        {copied ? <Check size={12} aria-hidden /> : <Link2 size={12} aria-hidden />}
        {copied ? "Copied" : "Copy link"}
        <kbd className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded border border-line text-faint ml-0.5 select-none">
          C
        </kbd>
      </button>
      {NETWORKS.map((n) => (
        <a
          key={n.label}
          href={n.url(target, title)}
          target="_blank"
          rel="noreferrer"
          className={chip}
        >
          {n.label}
        </a>
      ))}
    </div>
  );
}
