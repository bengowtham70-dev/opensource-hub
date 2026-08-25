# Drag and Drop Skill

> Build sortable lists, kanban boards, and file drop zones with dnd-kit — touch-friendly, keyboard-accessible, production-ready

## Install

```bash
npx skills add YepAPI/skills --skill drag-and-drop
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to implement drag-and-drop interactions using `@dnd-kit/core` and `@dnd-kit/sortable`. It covers sortable lists with `useSortable()`, multi-container kanban boards with multiple `<SortableContext>` wrappers, file drop zones with `react-dropzone`, touch and keyboard accessibility out of the box, optimistic reorder with server persistence and rollback on error, and `<DragOverlay>` for polished visual feedback during drag operations.

## Key Features

- **Sortable Lists** — Vertical or horizontal reorderable lists using `<SortableContext>` and `useSortable()`, with smooth animations powered by CSS transforms
- **Kanban Boards** — Multi-container drag-and-drop with `<DndContext>` wrapping multiple `<SortableContext>` containers, one per column, with cross-column item movement
- **File Drop Zones** — Drag-and-drop file upload areas using `react-dropzone` or native `onDragOver`/`onDrop` with `e.dataTransfer.files`
- **Touch and Keyboard Accessibility** — dnd-kit handles `TouchSensor`, `PointerSensor`, and `KeyboardSensor` with `sortableKeyboardCoordinates` natively, so every interaction works on every device
- **Optimistic Reorder with Rollback** — Updates state immediately on drop for instant feedback, persists to server in background, and rolls back if the save fails

## Use Cases

- Building a project management tool with draggable kanban columns and cards
- Creating a content builder where users reorder sections, blocks, or widgets by dragging
- Adding a file manager with drag-and-drop upload and folder organization
- Shipping a workflow editor where users rearrange steps, stages, or pipeline items

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
