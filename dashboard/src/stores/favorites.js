import { create } from "zustand";
import { api } from "../lib/api";

// PRD section 2.4: favorites are local-first, one click, no login.
export const useFavorites = create((set, get) => ({
  items: [],
  loaded: false,

  async load() {
    try {
      const items = await api.favorites();
      set({ items, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  has(repo) {
    return get().items.some((i) => i.repo.toLowerCase() === repo.toLowerCase());
  },

  async toggle(repo) {
    const exists = get().has(repo);
    if (exists) {
      const prev = get().items;
      set({ items: prev.filter((i) => i.repo.toLowerCase() !== repo.toLowerCase()) });
      try {
        await api.removeFavorite(repo);
      } catch {
        set({ items: prev }); // optimistic revert — UI never lies about state
      }
    } else {
      const prev = get().items;
      set({ items: [{ repo, addedAt: new Date().toISOString() }, ...prev] });
      try {
        const items = await api.addFavorite(repo);
        set({ items });
      } catch {
        set({ items: prev }); // ghost-entry guard (same rule as community votes)
      }
    }
  },
}));
