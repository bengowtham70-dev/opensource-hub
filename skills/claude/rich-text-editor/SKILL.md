---
name: rich-text-editor
description: "Tiptap/Plate editor setup, slash commands, toolbar, collaborative editing, and markdown export."
homepage: https://yepapi.com/skills/rich-text-editor
metadata:
  tags: [editor, tiptap, richtext, wysiwyg]
---

# Rich Text Editor

## Rules

- Tiptap for most projects — built on ProseMirror, headless, fully customizable, React-friendly
- Plate as alternative — opinionated component library built on Slate, faster to set up with pre-built UI
- Extensions: start with `StarterKit` (bold, italic, headings, lists, code blocks, blockquote, horizontal rule)
- Slash commands: register a `/` trigger extension — show a dropdown menu of block types to insert
- Toolbar: floating or fixed, show active state for formatting buttons, group related actions
- Content storage: store as JSON (Tiptap's native format) for editing, render to HTML for display
- Markdown export: use `@tiptap/extension-markdown` or serialize JSON to markdown with a custom serializer
- Collaborative editing: Yjs integration via `@tiptap/extension-collaboration` + WebSocket provider
- Image uploads in editor: drag-and-drop or paste, upload to storage, insert as image node

## Patterns

```tsx
// Tiptap setup
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

function Editor({ content, onChange }: { content: string; onChange: (json: JSONContent) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  return (
    <div className="border rounded-lg">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  );
}
```

```tsx
// Toolbar component
function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex gap-1 border-b p-2">
      <button onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-muted" : ""}>B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-muted" : ""}>I</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}>H2</button>
    </div>
  );
}
```

## Avoid

- Storing content as raw HTML — use Tiptap JSON for editing, render HTML only for display
- Building a custom editor from scratch — use Tiptap or Plate; ProseMirror/Slate are low-level
- Missing placeholder text — empty editors look broken without guidance
- Forgetting to sanitize HTML output — always sanitize before rendering user-generated content
