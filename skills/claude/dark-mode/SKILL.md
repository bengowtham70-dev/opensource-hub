---
name: dark-mode
description: "Theme switching with CSS variables, system preference detection, next-themes, and persistence."
homepage: https://yepapi.com/skills/dark-mode
metadata:
  tags: [theme, dark-mode, css-variables, next-themes]
---

# Dark Mode

## Rules

- Use `next-themes` for Next.js apps — wraps the app in `<ThemeProvider attribute="class" defaultTheme="system">`
- CSS variables for colors — define in `:root` (light) and `.dark` (dark), reference as `var(--background)`
- System preference detection: `defaultTheme="system"` respects `prefers-color-scheme` media query
- Theme toggle component: cycle between light/dark/system — use `useTheme()` hook from `next-themes`
- Tailwind integration: enable `darkMode: "class"` in tailwind config, use `dark:` prefix for overrides
- Hydration fix: suppress hydration mismatch by mounting theme toggle only after `useEffect` or using `suppressHydrationWarning`
- Persistence: `next-themes` stores preference in `localStorage` and applies it as a `class` on `<html>`
- Transition: add `transition-colors duration-200` to body for smooth theme switch

## Patterns

```tsx
// Layout wrapper
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

```tsx
// Theme toggle
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
```

```css
/* CSS variables */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

## Avoid

- Hardcoding colors instead of CSS variables — makes theming impossible
- Forgetting `suppressHydrationWarning` on `<html>` — causes hydration errors
- Flash of wrong theme: ensure `next-themes` script runs before paint (it does by default)
- Only supporting light/dark without system option — respect user OS preference
