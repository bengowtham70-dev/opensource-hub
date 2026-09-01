import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Search, TrendingUp, Flame, TrendingDown, Trophy, Heart, BookOpen, Server, Monitor, Apple, Terminal, Globe, ShieldCheck, Scale } from "lucide-react";
import { api } from "../lib/api";
import { getPairings } from "../lib/seed";

// Cmd/Ctrl+K command palette per AGENTS.md §5.1 — instant keyboard navigation.
export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [pairings, setPairings] = useState([]);

  useEffect(() => {
    if (!open) return;
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

  // PRD Phase 2 item 1 — quick-filter commands (plans/PLAN_PHASE2.md Phase 2).
  const filters = [
    { icon: Server, label: "Self-hostable only", to: "/?platform=self-host" },
    { icon: Monitor, label: "Windows apps", to: "/?platform=win" },
    { icon: Apple, label: "macOS apps", to: "/?platform=mac" },
    { icon: Terminal, label: "Linux apps", to: "/?platform=linux" },
    { icon: Globe, label: "Web apps", to: "/?platform=web" },
    { icon: ShieldCheck, label: "Permissive licenses", to: "/?license=permissive" },
    { icon: Scale, label: "Copyleft licenses", to: "/?license=copyleft" },
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global command menu"
      className="fixed inset-0 z-50"
      overlayClassName="fixed inset-0 bg-black/60"
      shouldFilter
    >
      <div className="fixed left-1/2 top-[18vh] w-[min(92vw,560px)] -translate-x-1/2">
        <Command.Input
          autoFocus
          placeholder="Search tools, alternatives, pages…"
          className="w-full rounded-t-xl bg-elevated border border-line border-b-transparent px-4 py-3.5 text-[15px] text-ink placeholder:text-faint outline-none"
        />
        <Command.List className="max-h-[46vh] overflow-y-auto rounded-b-xl bg-elevated border border-line p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-faint">
            Nothing found — try a tool name like “Notion” or “Figma”.
          </Command.Empty>

          <Command.Group heading="Views" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint">
            {views.map((v) => (
              <Item key={v.to} onSelect={() => go(v.to)}>
                <v.icon size={15} className="text-faint" />
                {v.label}
              </Item>
            ))}
          </Command.Group>

          <Command.Group heading="Filters" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint">
            {filters.map((f) => (
              <Item key={f.to} onSelect={() => go(f.to)}>
                <f.icon size={15} className="text-faint" />
                {f.label}
              </Item>
            ))}
          </Command.Group>

          <Command.Group heading="Find alternatives for…" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint">
            {pairings.map((p) => (
              <Item key={p.paidTool.slug} onSelect={() => go(`/?q=${encodeURIComponent(p.paidTool.name)}`)}>
                <Search size={15} className="text-tech" />
                <span>
                  Free alternatives to <span className="text-ink">{p.paidTool.name}</span>
                </span>
              </Item>
            ))}
          </Command.Group>

          <Command.Group heading="Learn" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint">
            {articles.map((a) => (
              <Item key={a.slug} onSelect={() => go(`/learn/${a.slug}`)}>
                <BookOpen size={15} className="text-trust" />
                {a.title}
              </Item>
            ))}
          </Command.Group>
        </Command.List>
        <p className="mt-2 text-center text-[11px] text-faint tnum">
          ↑↓ navigate · ↵ select · esc close
        </p>
      </div>
    </Command.Dialog>
  );
}

function Item({ children, onSelect }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-dim cursor-pointer data-[selected=true]:bg-primary/15 data-[selected=true]:text-ink transition-colors"
    >
      {children}
    </Command.Item>
  );
}
