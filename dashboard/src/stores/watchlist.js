import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

// F6 (plans/PLAN_FEATURES.md) — watchlist: repo → last-seen trust score.
// Local-first (zustand persist); alerts computed server-side from live trust.
export const useWatchlist = create(
  persist(
    (set, get) => ({
      watched: {}, // repo -> lastScore (number)

      isWatched(repo) {
        return repo in get().watched;
      },

      count() {
        return Object.keys(get().watched).length;
      },

      async toggle(repo, currentScore = null) {
        const next = { ...get().watched };
        if (repo in next) delete next[repo];
        else next[repo] = currentScore;
        set({ watched: next });
        return repo in next;
      },

      markSeen(repo, score) {
        if (repo in get().watched) {
          set({ watched: { ...get().watched, [repo]: score } });
        }
      },

      async check() {
        const entries = Object.entries(get().watched).map(([repo, lastScore]) => ({
          repo,
          lastScore,
        }));
        if (!entries.length) return { alerts: [] };
        const json = await api.watchlistCheck(entries);
        return json;
      },
    }),
    { name: "osh-watchlist" }
  )
);
