import { create } from "zustand";
import { persist } from "zustand/middleware";

// F7 — AI settings live in the user's browser only (localStorage).
// The key is sent per-request to the local server and never persisted there.
export const useAiSettings = create(
  persist(
    (set, get) => ({
      key: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5.4-mini",
      open: false,

      setKey(key) {
        set({ key: key.trim() });
      },
      setBaseUrl(baseUrl) {
        set({ baseUrl: baseUrl.trim() || "https://api.openai.com/v1" });
      },
      setModel(model) {
        set({ model: model.trim() || "gpt-5.4-mini" });
      },
      setPreset(type) {
        if (type === "ollama") {
          set({
            baseUrl: "http://localhost:11434/v1",
            model: "llama3",
            key: "",
          });
        } else if (type === "openrouter") {
          set({
            baseUrl: "https://openrouter.ai/api/v1",
            model: "meta-llama/llama-3.1-8b-instruct",
          });
        } else {
          set({
            baseUrl: "https://api.openai.com/v1",
            model: "gpt-5.4-mini",
          });
        }
      },
      toggleOpen() {
        set({ open: !get().open });
      },
    }),
    { name: "osh-ai-settings" }
  )
);
