import { useEffect, useState } from "react";
import { BookOpen, Copy, Check, ExternalLink, RefreshCw, FileText } from "lucide-react";
import Markdown from "../lib/markdown";

export default function RepoReadmeViewer({ owner, name }) {
  const [markdown, setMarkdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fullName = `${owner}/${name}`;

  const fetchReadme = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repo/${owner}/${name}/readme`);
      if (res.ok) {
        const data = await res.json();
        if (data.markdown) {
          setMarkdown(data.markdown);
        } else {
          setError("No README content found.");
        }
      } else {
        setError("README unavailable on GitHub.");
      }
    } catch (err) {
      setError("Failed to load README.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadme();
  }, [owner, name]);

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-3 py-3 animate-pulse">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-7 w-24 rounded-full" />
        </div>
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-20 w-full rounded-xl" />
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !markdown) {
    return (
      <div className="p-6 text-center space-y-3 border border-dashed border-line rounded-2xl bg-surface/50">
        <div className="size-10 rounded-full bg-elevated border border-line grid place-items-center text-dim mx-auto">
          <FileText size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">README documentation preview unavailable</p>
          <p className="text-xs text-faint mt-0.5">The repository might not have a public root README or is temporarily unreachable.</p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={fetchReadme}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
          <a
            href={`https://github.com/${fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-elevated text-xs font-medium text-ink cursor-pointer"
          >
            <span>View on GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2 text-xs text-dim">
          <BookOpen size={14} className="text-ink" />
          <span className="font-semibold text-ink">README.md</span>
          <span className="text-faint">({Math.round(markdown.length / 1024)} KB)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink shadow-2xs transition-colors cursor-pointer"
            title="Copy raw markdown to clipboard"
          >
            {copied ? <Check size={12} className="text-trust" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy Raw"}</span>
          </button>

          <a
            href={`https://github.com/${fullName}#readme`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center gap-1 px-3 py-1 rounded-full border border-line bg-surface hover:bg-elevated text-xs font-medium text-dim hover:text-ink shadow-2xs transition-colors cursor-pointer"
          >
            <span>GitHub</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Markdown Content Area */}
      <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin rounded-xl bg-canvas/30 p-4 border border-line/60">
        <div className="prose-content text-sm text-dim leading-relaxed space-y-3">
          <Markdown source={markdown} />
        </div>
      </div>
    </div>
  );
}
