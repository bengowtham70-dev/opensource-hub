# Rich Text Editor Skill

> Add a Notion-style editor to your app with Tiptap or Plate — slash commands, toolbar, collaborative editing, and markdown export

## Install

```bash
npx skills add YepAPI/skills --skill rich-text-editor
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build rich text editors using Tiptap (built on ProseMirror, headless and fully customizable) or Plate (built on Slate, with pre-built UI components). It covers the StarterKit extension bundle, slash command menus for inserting block types, floating and fixed toolbars with active state indicators, JSON content storage for editing with HTML rendering for display, markdown export, collaborative editing via Yjs, and drag-and-drop image uploads within the editor.

## Key Features

- **Tiptap and Plate Setup** — Tiptap for headless flexibility with full customization, or Plate for faster setup with pre-built UI components — your agent picks the right one
- **Slash Commands** — Register a `/` trigger extension that opens a dropdown menu of block types (headings, lists, code blocks, images) for Notion-style content insertion
- **Formatting Toolbar** — Floating or fixed toolbar with bold, italic, heading, and list buttons that show active state, grouped by function for clean UX
- **Collaborative Editing** — Real-time multi-user editing via `@tiptap/extension-collaboration` with Yjs and WebSocket providers so teams can write together
- **Content Storage and Export** — Store content as Tiptap JSON for editing, render to sanitized HTML for display, and export to markdown with `@tiptap/extension-markdown`

## Use Cases

- Building a blog CMS where authors write posts with formatting, images, and code blocks
- Creating a documentation tool with collaborative editing, slash commands, and markdown export
- Adding an email composer with rich formatting, templates, and inline image support
- Shipping a note-taking app with real-time collaboration, slash commands, and keyboard shortcuts

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
