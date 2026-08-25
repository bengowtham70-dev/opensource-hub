---
name: command-palette
description: "cmdk integration, Cmd+K trigger, fuzzy search, grouped actions, keyboard navigation, and dynamic action registration."
homepage: https://yepapi.com/skills/command-palette
metadata:
  tags: [command-palette, cmdk, keyboard, search]
---

# Command Palette

## Rules

- Use `cmdk` library — composable, accessible, fast fuzzy search built-in
- Trigger: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) — register global keyboard listener
- Group actions: Navigation (pages), Commands (actions), Recent (last used) — show group headings
- Keyboard navigation: arrow keys to move, Enter to select, Escape to close — all handled by cmdk
- Fuzzy search: cmdk filters automatically — match highlighting with score-based ranking
- Recent items: store last 5-10 selected items in localStorage — show at top when input is empty
- Dynamic actions: register actions from different parts of the app — context-aware (show different actions on different pages)
- Loading state: async search results (e.g., API search) — show loading indicator in results area

## Patterns

```tsx
import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command palette">
      <Command.Input placeholder="Search or type a command..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Recent">
          {recentItems.map((item) => (
            <Command.Item key={item.id} onSelect={() => { router.push(item.href); setOpen(false); }}>
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Navigation">
          <Command.Item onSelect={() => { router.push("/dashboard"); setOpen(false); }}>
            Dashboard
          </Command.Item>
          <Command.Item onSelect={() => { router.push("/settings"); setOpen(false); }}>
            Settings
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Commands">
          <Command.Item onSelect={() => { toggleTheme(); setOpen(false); }}>
            Toggle dark mode
          </Command.Item>
          <Command.Item onSelect={() => { logout(); setOpen(false); }}>
            Sign out
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

## Avoid

- Building custom fuzzy search — cmdk handles filtering, scoring, and ranking out of the box
- Forgetting `e.preventDefault()` on `Cmd+K` — without it, the browser's default search/address bar opens
- Missing Escape key handling — cmdk handles this via `onOpenChange`, but ensure focus returns to previous element
- Static-only actions — register actions dynamically from page context (e.g., "Edit this post" only on post pages)
- No empty state — always show "No results found" when search matches nothing
