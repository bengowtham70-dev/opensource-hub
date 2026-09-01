import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

export function createAdminStore({ dir = process.env.OSH_DATA_DIR || getUserDataDir() } = {}) {
  const file = path.join(dir, "admin-queue.json");
  const SCHEMA_VERSION = 1;

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION) return raw;
    } catch {
      // fresh start
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      pending: [
        {
          id: "sub_seed_1",
          name: "Ollama",
          url: "https://github.com/ollama/ollama",
          category: "AI & Machine Learning",
          replaces: "OpenAI API",
          note: "Runs Llama 3 and Mistral locally on GPU/CPU with OpenAI-compatible API.",
          submittedAt: new Date(Date.now() - 3600000).toISOString(),
          status: "pending",
        },
        {
          id: "sub_seed_2",
          name: "Uptime Kuma",
          url: "https://github.com/louislam/uptime-kuma",
          category: "Monitoring",
          replaces: "Pingdom",
          note: "Self-hosted monitoring tool with clean UI and status pages.",
          submittedAt: new Date(Date.now() - 7200000).toISOString(),
          status: "pending",
        },
      ],
      processed: [],
    };
  }

  function write(data) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    getQueue() {
      const data = read();
      return {
        pending: data.pending,
        processed: data.processed,
        totalPending: data.pending.length,
        totalProcessed: data.processed.length,
      };
    },

    submitCandidate({ name, url, category = "Developer Tools", replaces = "", note = "" }) {
      const cleanName = String(name || "").trim();
      const cleanUrl = String(url || "").trim();
      if (!cleanName || !cleanUrl) throw new Error("Name and URL are required");

      const data = read();
      const item = {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        url: cleanUrl,
        category: String(category).trim(),
        replaces: String(replaces).trim(),
        note: String(note).trim().slice(0, 500),
        submittedAt: new Date().toISOString(),
        status: "pending",
      };

      data.pending.unshift(item);
      write(data);
      return item;
    },

    approve(id) {
      const data = read();
      const idx = data.pending.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Submission not found in pending queue");

      const [item] = data.pending.splice(idx, 1);
      item.status = "approved";
      item.processedAt = new Date().toISOString();
      data.processed.unshift(item);

      write(data);
      return { ok: true, approved: item };
    },

    reject(id, reason = "Did not meet open-source verification criteria") {
      const data = read();
      const idx = data.pending.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Submission not found in pending queue");

      const [item] = data.pending.splice(idx, 1);
      item.status = "rejected";
      item.reason = String(reason).trim();
      item.processedAt = new Date().toISOString();
      data.processed.unshift(item);

      write(data);
      return { ok: true, rejected: item };
    },
  };
}
