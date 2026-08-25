import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Search, Flame, Heart, BookOpen, Sparkles, Bookmark, Layers, Sun, Moon } from "lucide-react";
import Byte from "./Byte";

const links = [
  { to: "/", label: "Trending", icon: Flame, end: true },
  { to: "/find", label: "AI Find", icon: Sparkles },
  { to: "/stack-audit", label: "Stack Audit", icon: Layers },
  { to: "/audits", label: "Audits", icon: Bookmark },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/learn", label: "Learn", icon: BookOpen },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("osh-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="btn-tactile grid place-items-center size-9 rounded-full border border-line bg-surface text-dim hover:text-ink hover:border-line-strong"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span className="relative block size-[16px]">
        <Sun
          size={16}
          className={`absolute inset-0 transition-all duration-150 ${dark ? "opacity-0 rotate-90" : "opacity-100 rotate-0"}`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-all duration-150 ${dark ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}
        />
      </span>
    </button>
  );
}

export default function Header({ onSearch }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 h-[68px] flex items-center gap-4">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0" aria-label="OpenSource Hub home">
          <span className="grid place-items-center size-8 rounded-md bg-strong text-surface font-display">
            ◆
          </span>
          <span className="font-display text-lg tracking-tight text-ink hidden sm:block">
            OpenSource Hub
          </span>
        </NavLink>

        <nav aria-label="Primary" className="flex items-center gap-1 ml-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive ? "bg-primary/15 text-ink border border-line-strong" : "text-dim hover:text-ink border border-transparent"
                }`
              }
            >
              <l.icon size={15} />
              <span className="hidden md:inline">{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={onSearch}
          className="btn-tactile ml-auto flex items-center gap-2 rounded-full border border-line bg-primary/5 px-3.5 py-1.5 text-sm text-faint hover:text-dim hover:border-line-strong min-w-[120px] md:min-w-[220px]"
          aria-label="Open command palette search"
        >
          <Search size={15} />
          <span className="hidden md:inline">Search alternatives…</span>
          <kbd className="ml-auto hidden md:inline-flex tnum text-[11px] px-1.5 py-0.5 rounded-sm border border-line bg-base/10">
            Ctrl K
          </kbd>
        </button>

        <ThemeToggle />

        <div className="shrink-0 hidden sm:block" title="Byte is watching over your downloads">
          <Byte size={40} />
        </div>
      </div>
    </header>
  );
}