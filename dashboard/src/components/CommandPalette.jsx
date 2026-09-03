import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  Search,
  TrendingUp,
  Flame,
  TrendingDown,
  Trophy,
  Heart,
  BookOpen,
  Server,
  Monitor,
  Apple,
  Terminal,
  Globe,
  ShieldCheck,
  Scale,
  Star,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
} from "lucide-react";
import { api } from "../lib/api";
import { getPairings } from "../lib/seed";
import { formatStars } from "../lib/format";

// Cmd/Ctrl+K command palette per AGENTS.md §5.1 — live 26,000+ catalog search.
export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [pairings, setPairings] = useState([]);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCatalogResults([]);
      return;
    }
    getPairings().then(setPairings).catch(() => {});
    api.learnList().then(setArticles).catch(() => {});
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Debounced live 26,000+ catalog search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setCatalogResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await api.catalog({ q: trimmed, limit: 10, sort: "stars" });
        setCatalogResults(data.results || []);
      } catch {
        setCatalogResults([]);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  const go = (to) => {
    onOpenChange(false);
    navigate(to);
  };

  const views = [
    { icon: Flame, label: "Today's trending", to: "/?view=today" },
    { icon: TrendingUp, label: "Yesterday's trending", to: "/?view=yesterday" },
    { icon: TrendingDown, label: "Least trending", to: "/?view=least" },
    { icon: Trophy, label: "All-time most starred", to: "/?view=all-time" },
    { icon: Heart, label: "Favorites", to: "/favorites" },
  ];

  const filters = [
    { icon: Server, label: "Self-hostable only", to: "/?platform=self-host" },
    { icon: Monitor, label: "Windows apps", to: "/?platform=win" },
    { icon: Apple, label: "macOS apps", to: "/?platform=mac" },
    { icon: Terminal, label: "Linux apps", to: "/?platform=linux" },
    { icon: Globe, label: "Web apps", to: "/?platform=web" },
    { icon: ShieldCheck, label: "Permissive licenses", to: "/?license=permissive" },
    { icon: Scale, label: "Copyleft licenses", to: "/?license=copyleft" },
  ];

  const quickTools = [
    { icon: Layers, label: "Custom Stack Builder & Docker Compose", to: "/stacks/builder" },
    { icon: ShieldCheck, label: "Stack Cost & Health Audit", to: "/stack-audit" },
    { icon: Server, label: "MCP AI Agent Server Hub", to: "/mcp" },
  ];

  const hasQuery = query.trim().length > 0;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global command menu"
      className="fixed inset-0 z-50"
      overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-xs"
      shouldFilter={!hasQuery}
    >
      <div className="fixed left-1/2 top-[16vh] w-[min(94vw,620px)] -translate-x-1/2 shadow-2xl rounded-2xl overflow-hidden border border-line bg-surface">
        <div className="relative flex items-center border-b border-line bg-surface px-4 py-3">
          <Search size={17} className="text-dim shrink-0 mr-3" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search 26,000+ open-source tools, commercial alternatives, topics…"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-faint outline-none font-medium"
          />
          {loading && (
            <span className="size-4 rounded-full border-2 border-line border-t-ink animate-spin shrink-0 ml-2" />
          )}
        </div>

        <Command.List className="max-h-[52vh] overflow-y-auto p-2 space-y-2">
          {hasQuery && catalogResults.length === 0 && !loading && (
            <Command.Empty className="px-4 py-8 text-center text-sm text-dim">
              No matching tools found for <strong className="text-ink">"{query}"</strong>.
              <div className="mt-2 text-xs text-faint">
                Press Enter to search the entire catalog or explore popular categories.
              </div>
            </Command.Empty>
          )}

          {/* 1. Live Catalog Search Results */}
          {hasQuery && catalogResults.length > 0 && (
            <Command.Group
              heading={`Matching Open Source Tools (${catalogResults.length})`}
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
            >
              {catalogResults.map((item) => {
                const a = item.alternative || {};
                const repoPath = a.repo ? `/repo/${a.repo}` : `/repo/${item.repo}`;
                const starsCount = a.stars ?? item.stars ?? 0;
                return (
                  <Item
                    key={a.repo || item.repo}
                    value={`${a.name || item.name} ${a.repo || item.repo} ${a.language || ""} ${a.description || ""}`}
                    onSelect={() => go(repoPath)}
                  >
                    <div className="size-7 rounded-lg bg-elevated border border-line grid place-items-center text-ink shrink-0">
                      <Code2 size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm truncate">{a.name || item.name}</span>
                        <span className="text-[11px] text-faint truncate">{a.repo || item.repo}</span>
                        {a.language && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-sm border border-line bg-elevated text-dim font-medium ml-auto shrink-0">
                            {a.language}
                          </span>
                        )}
                        {starsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink font-semibold tnum shrink-0">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            {formatStars(starsCount)}
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-dim truncate mt-0.5">{a.description}</p>
                      )}
                    </div>
                  </Item>
                );
              })}
            </Command.Group>
          )}

          {/* 2. Commercial SaaS Alternatives */}
          {hasQuery && (
            <Command.Group
              heading="Commercial Software Alternatives"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
            >
              <Item
                value={`Free alternatives to ${query}`}
                onSelect={() => go(`/alternatives/${encodeURIComponent(query.toLowerCase().trim())}`)}
              >
                <Search size={15} className="text-ember shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">
                    Search free open-source alternatives to <strong className="text-ink font-semibold">"{query}"</strong>
                  </span>
                  <span className="block text-[11px] text-faint">
                    View side-by-side feature parity &amp; annual SaaS savings
                  </span>
                </div>
                <ArrowRight size={13} className="text-dim shrink-0" />
              </Item>
            </Command.Group>
          )}

          {/* 3. Static Navigation Shortcuts (visible on empty query or when matched) */}
          {!hasQuery && (
            <>
              <Command.Group
                heading="Quick Tools"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
              >
                {quickTools.map((t) => (
                  <Item key={t.to} onSelect={() => go(t.to)}>
                    <t.icon size={15} className="text-faint shrink-0" />
                    <span>{t.label}</span>
                  </Item>
                ))}
              </Command.Group>

              <Command.Group
                heading="Discovery Views"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
              >
                {views.map((v) => (
                  <Item key={v.to} onSelect={() => go(v.to)}>
                    <v.icon size={15} className="text-faint shrink-0" />
                    <span>{v.label}</span>
                  </Item>
                ))}
              </Command.Group>

              <Command.Group
                heading="Filter by Platform & License"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
              >
                {filters.map((f) => (
                  <Item key={f.to} onSelect={() => go(f.to)}>
                    <f.icon size={15} className="text-faint shrink-0" />
                    <span>{f.label}</span>
                  </Item>
                ))}
              </Command.Group>

              <Command.Group
                heading="Popular Alternatives"
                className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint"
              >
                {pairings.slice(0, 6).map((p) => (
                  <Item
                    key={p.paidTool.slug}
                    value={`Free alternatives to ${p.paidTool.name}`}
                    onSelect={() => go(`/alternatives/${p.paidTool.slug}`)}
                  >
                    <Search size={15} className="text-tech shrink-0" />
                    <span>
                      Free alternatives to <strong className="text-ink">{p.paidTool.name}</strong>
                    </span>
                  </Item>
                ))}
              </Command.Group>
            </>
          )}
        </Command.List>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 bg-elevated text-[11px] text-faint tnum">
          <span>
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface font-sans">↑</kbd>{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface font-sans">↓</kbd> navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface font-sans">↵</kbd> select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface font-sans">esc</kbd> close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}

function Item({ children, onSelect, value }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-dim cursor-pointer data-[selected=true]:bg-ink data-[selected=true]:text-surface dark:data-[selected=true]:bg-surface dark:data-[selected=true]:text-ink transition-colors group"
    >
      {children}
    </Command.Item>
  );
}
