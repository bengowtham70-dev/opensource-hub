---
name: drag-and-drop
description: "Sortable lists, kanban boards, file drop zones with dnd-kit, touch support, and accessibility."
homepage: https://yepapi.com/skills/drag-and-drop
metadata:
  tags: [dnd, kanban, sortable, dnd-kit]
---

# Drag and Drop

## Rules

- Use `@dnd-kit/core` + `@dnd-kit/sortable` — modern, accessible, touch-friendly DnD library
- Sortable lists: wrap in `<SortableContext>`, each item uses `useSortable()` hook
- Kanban boards: `<DndContext>` with multiple `<SortableContext>` containers — one per column
- File drop zones: `react-dropzone` or native `onDragOver`/`onDrop` with `e.dataTransfer.files`
- Touch support: dnd-kit handles touch natively — use `TouchSensor` and `PointerSensor` with activation constraints
- Accessibility: dnd-kit provides keyboard DnD out of the box — `KeyboardSensor` with `sortableKeyboardCoordinates`
- Optimistic reorder: update state immediately on drop, persist to server in background, rollback on error
- Drag overlay: use `<DragOverlay>` for a floating preview of the dragged item — better visual feedback

## Patterns

```tsx
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function SortableList({ items }: { items: Item[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>{item.name}</SortableItem>
        ))}
      </SortableContext>
      <DragOverlay>{activeId ? <ItemPreview id={activeId} /> : null}</DragOverlay>
    </DndContext>
  );
}
```

## Avoid

- Using HTML5 drag API directly — poor touch/mobile/accessibility support
- Forgetting keyboard accessibility — always include `KeyboardSensor`
- Mutating state during drag — update only on `onDragEnd`
- Missing `DragOverlay` — without it, the original item disappears during drag with no visual feedback
