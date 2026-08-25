import { create } from "zustand";
import { persist } from "zustand/middleware";

// F12 — recently viewed history (local, cap 20, most recent first).
export const useHistory = create(
  persist(
    (set, get) => ({
      items: [], // [{ repo, name, at }]

      record(repo, name) {
        const rest = get().items.filter((i) => i.repo !== repo);
        set({ items: [{ repo, name, at: new Date().toISOString() }, ...rest].slice(0, 20) });
      },

      clear() {
        set({ items: [] });
      },
    }),
    { name: "osh-history" }
  )
);
