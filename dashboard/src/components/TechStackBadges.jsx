import { Cpu, Database, Box, Layers, Code2 } from "lucide-react";

// Curated tech stack definitions with authentic brand colors and icons
const KNOWN_STACKS = {
  typescript: { label: "TypeScript", color: "#3178C6", category: "Language" },
  javascript: { label: "JavaScript", color: "#F7DF1E", category: "Language" },
  rust: { label: "Rust", color: "#CE412B", category: "Language" },
  go: { label: "Go", color: "#00ADD8", category: "Language" },
  golang: { label: "Go", color: "#00ADD8", category: "Language" },
  python: { label: "Python", color: "#3776AB", category: "Language" },
  c: { label: "C", color: "#A8B9CC", category: "Language" },
  "c++": { label: "C++", color: "#00599C", category: "Language" },
  cpp: { label: "C++", color: "#00599C", category: "Language" },
  elixir: { label: "Elixir", color: "#4B275F", category: "Language" },
  php: { label: "PHP", color: "#777BB4", category: "Language" },
  dart: { label: "Dart", color: "#0175C2", category: "Language" },
  swift: { label: "Swift", color: "#F05138", category: "Language" },
  docker: { label: "Docker", color: "#2496ED", category: "Infrastructure" },
  postgres: { label: "PostgreSQL", color: "#4169E1", category: "Database" },
  postgresql: { label: "PostgreSQL", color: "#4169E1", category: "Database" },
  sqlite: { label: "SQLite", color: "#003B57", category: "Database" },
  redis: { label: "Redis", color: "#DC382D", category: "Database" },
  react: { label: "React", color: "#61DAFB", category: "Frontend" },
  vue: { label: "Vue", color: "#4FC08D", category: "Frontend" },
  nextjs: { label: "Next.js", color: "#000000", category: "Framework" },
  electron: { label: "Electron", color: "#47848F", category: "Desktop" },
  tauri: { label: "Tauri", color: "#24C8DB", category: "Desktop" },
  crdt: { label: "CRDT", color: "#059669", category: "Architecture" },
  "local-first": { label: "Local-First", color: "#059669", category: "Architecture" },
  graphql: { label: "GraphQL", color: "#E10098", category: "API" },
};

function getCategoryIcon(cat) {
  switch (cat) {
    case "Database":
      return <Database size={12} className="text-dim" />;
    case "Infrastructure":
      return <Box size={12} className="text-dim" />;
    case "Architecture":
      return <Layers size={12} className="text-dim" />;
    default:
      return <Code2 size={12} className="text-dim" />;
  }
}

export default function TechStackBadges({ language, tags = [], platforms = [] }) {
  const stackKeys = new Set();

  if (language) stackKeys.add(language.toLowerCase());
  for (const t of tags) {
    const k = t.toLowerCase();
    if (KNOWN_STACKS[k]) stackKeys.add(k);
  }
  if (platforms.includes("self-host") && !stackKeys.has("docker")) {
    stackKeys.add("docker");
  }

  const items = Array.from(stackKeys)
    .map((k) => KNOWN_STACKS[k] || { label: k.charAt(0).toUpperCase() + k.slice(1), color: "var(--c-dim)", category: "Stack" })
    .slice(0, 7);

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1" aria-label="Tech stack and architecture">
      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-faint mr-1 font-medium select-none">
        <Cpu size={12} aria-hidden /> Built with
      </span>
      {items.map((item) => (
        <span
          key={item.label}
          title={`${item.label} (${item.category})`}
          className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-line bg-surface/80 hover:border-line-strong hover:bg-elevated text-dim hover:text-ink text-[11.5px] tnum font-medium transition-all"
        >
          {getCategoryIcon(item.category)}
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
