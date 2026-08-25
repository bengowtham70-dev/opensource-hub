import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/api";

// PRD §34 community layer — client half (plans/PLAN_PHASE2.md P8).
// state-management skill rules applied: zustand persist holds ONLY client-owned
// state ("my vote"); aggregate counts are server state fetched per page view and
// kept in component-local useState — never mixed into the global store.
// Votes are optimistic with revert-on-error (skill rule).
export const useCommunity = create(
  persist(
    (set, get) => ({
      myVotes: {}, // repo -> "yes" | "no" | null

      myVote(repo) {
        return get().myVotes[repo] ?? null;
      },

      async vote(repo, choice) {
        const prev = get().myVotes[repo] ?? null;
        const next = prev === choice ? null : choice;
        // Optimistic: flip immediately, revert if the mirror POST fails.
        set({ myVotes: { ...get().myVotes, [repo]: next } });
        try {
          return await api.communityVote(repo, choice);
        } catch (err) {
          set({ myVotes: { ...get().myVotes, [repo]: prev } });
          throw err;
        }
      },
    }),
    { name: "osh-community" }
  )
);
