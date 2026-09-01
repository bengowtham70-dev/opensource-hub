import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Search, ArrowRight, Code2, Database, Box, Cpu } from "lucide-react";
import seed from "../../../src/data/alternatives.json";

const STACK_CATEGORIES = [
  {
    id: "languages",
    label: "Programming Languages",
    icon: Code2,
    matcher: (item) => ["typescript", "rust", "go", "python", "javascript", "c++", "elixir", "dart", "ruby", "c#", "java", "php", "swift", "kotlin", "clojure"].includes(item.toLowerCase()),
  },
  {
    id: "databases",
    label: "Databases & Storage",
    icon: Database,
    matcher: (item) => ["sqlite", "postgresql", "postgres", "redis", "mongodb", "mysql", "clickhouse", "s3", "duckdb", "neo4j"].includes(item.toLowerCase()),
  },
  {
    id: "runtimes",
    label: "Runtimes, Frameworks & UI",
    icon: Box,
    matcher: (item) => ["react", "vue", "svelte", "tailwind", "flutter", "electron", "tauri", "next.js", "node.js", "django", "fastapi", "spring"].includes(item.toLowerCase()),
  },
  {
    id: "architecture",
    label: "Architecture & Infrastructure",
    icon: Cpu,
    matcher: (item) => ["docker", "docker-compose", "crdt", "webassembly", "wasm", "kubernetes", "webrtc", "graphql", "p2p", "local-first"].includes(item.toLowerCase()),
  },
];

export default function StacksPage() {
  const [query, setQuery] = useState("");

  const stacksWithTools = useMemo(() => {
    const map = new Map();
    for (const p of seed.pairings) {
      const items = new Set();
      if (p.alternative?.language) items.add(p.alternative.language);
      for (const t of p.alternative?.tags || []) items.add(t);
      if (p.alternative?.ecosystems?.docker) items.add("Docker");

      for (const raw of items) {
        const key = raw.trim();
        if (!key) continue;
        const normKey = key.toLowerCase();
        if (!map.has(normKey)) {
          map.set(normKey, { name: key, norm: normKey, tools: [] });
        }
        map.get(normKey).tools.push({
          name: p.alternative.name,
          repo: p.alternative.repo,
          paidTool: p.paidTool.name,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.tools.length - a.tools.length || a.name.localeCompare(b.name));
  }, []);

  const filteredStacks = useMemo(() => {
    if (!query) return stacksWithTools;
    const q = query.toLowerCase();
    return stacksWithTools.filter(
      (s) => s.name.toLowerCase().includes(q) || s.tools.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [stacksWithTools, query]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-10 space-y-10">
      {/* Header */}
      <header className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
          <Layers size={13} className="text-accent" />
          <span>Technology & Architecture Index</span>
        </div>
        <h1 className="font-display text-display-lg text-ink">
          Browse by Tech Stack
        </h1>
        <p className="text-sm md:text-base text-dim leading-relaxed">
          Find open source replacements categorized by underlying infrastructure, languages, databases, and deployment runtimes.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md pt-2">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stack (Rust, Docker, SQLite, CRDT...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-faint outline-none focus:border-line-strong shadow-2xs"
          />
        </div>
      </header>

      {/* Categorized Stacks */}
      <div className="space-y-10">
        {STACK_CATEGORIES.map((cat) => {
          const matching = filteredStacks.filter((s) => cat.matcher(s.norm));
          if (matching.length === 0) return null;
          const Icon = cat.icon;

          return (
            <section key={cat.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <Icon size={18} className="text-accent" />
                <h2 className="font-display text-xl font-bold text-ink">
                  {cat.label} ({matching.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matching.map((s) => (
                  <div key={s.norm} className="card-elevated p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/?q=${encodeURIComponent(s.name)}`}
                          className="font-display text-lg font-semibold text-ink hover:text-link transition-colors"
                        >
                          {s.name}
                        </Link>
                        <span className="px-2 py-0.5 rounded-full bg-elevated border border-line text-xs font-semibold text-dim tnum">
                          {s.tools.length} tool{s.tools.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="text-xs text-dim">
                        Featured in:{" "}
                        <span className="text-ink font-medium">
                          {s.tools.slice(0, 3).map((t) => t.name).join(", ")}
                          {s.tools.length > 3 ? ` +${s.tools.length - 3} more` : ""}
                        </span>
                      </p>
                    </div>

                    <Link
                      to={`/?q=${encodeURIComponent(s.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-link pt-2 border-t border-line/60"
                    >
                      <span>Explore all {s.name} tools</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
