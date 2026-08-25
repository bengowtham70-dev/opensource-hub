---
name: infinite-scroll
description: "Cursor-based pagination, IntersectionObserver, virtualized lists with @tanstack/react-virtual, and scroll position restoration."
homepage: https://yepapi.com/skills/infinite-scroll
metadata:
  tags: [pagination, infinite-scroll, virtual-list, cursor]
---

# Infinite Scroll

## Rules

- Cursor-based pagination: use last item's ID or timestamp as cursor — not offset, which breaks on insertions/deletions
- IntersectionObserver: attach to a sentinel element at the bottom of the list — trigger fetch when visible
- Virtualization: `@tanstack/react-virtual` for lists with 1,000+ items — renders only visible rows in the DOM
- Loading skeleton: show placeholder items at bottom while fetching next page — not a spinner
- "Load more" button: provide as fallback for users who prefer manual control or have slow connections
- Scroll position restoration: save scroll position before navigation, restore on back — use `sessionStorage` or router state
- Empty state: show a message when the list has zero items — not a blank page
- End of list: show "You've reached the end" when `hasNextPage` is false — stop observer

## Patterns

```tsx
// Infinite scroll with React Query + IntersectionObserver
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";

function InfiniteList() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam }) => fetchItems({ cursor: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage) fetchNextPage(); },
      { rootMargin: "200px" } // prefetch before user reaches bottom
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      {allItems.map((item) => <ItemCard key={item.id} item={item} />)}
      {isFetchingNextPage && <LoadingSkeleton count={3} />}
      {!hasNextPage && allItems.length > 0 && <p>You've reached the end</p>}
      {allItems.length === 0 && !isFetchingNextPage && <EmptyState />}
      <div ref={sentinelRef} />
    </div>
  );
}

// Virtualized list for 10k+ items
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // estimated row height in px
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.key} style={{
            position: "absolute", top: 0, left: 0, width: "100%",
            transform: `translateY(${virtualRow.start}px)`,
          }}>
            <ItemCard item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Avoid

- Offset-based pagination — insertions/deletions shift all offsets, causing duplicate or missing items
- Loading all items then filtering client-side — fetch only the current page from the server
- Rendering 10k+ DOM nodes — use `@tanstack/react-virtual` to render only visible rows
- IntersectionObserver without `rootMargin` — add 100-200px margin to prefetch before user reaches the bottom
- Missing end-of-list indicator — users need to know there's nothing more to load
