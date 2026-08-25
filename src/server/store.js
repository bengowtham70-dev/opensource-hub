import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

// PRD section 2.4 / section 5: favorites are local-only, no login.
// Stored in the user data dir so they survive npm updates (PRD section 12).
export function createFavoritesStore({ dir = process.env.OSH_DATA_DIR || getUserDataDir() } = {}) {
  const file = path.join(dir, "favorites.json");
  const SCHEMA_VERSION = 1;

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION && Array.isArray(raw.items)) return raw;
    } catch {
      // first run or corrupted file — start fresh rather than crash
    }
    return { schemaVersion: SCHEMA_VERSION, items: [] };
  }

  function write(data) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    list() {
      // Most recent first (PRD section 2.4); insertion order breaks same-ms ties.
      return read()
        .items.map((item, i) => ({ item, i }))
        .sort((a, b) => new Date(b.item.addedAt) - new Date(a.item.addedAt) || b.i - a.i)
        .map(({ item }) => item);
    },
    has(repo) {
      return read().items.some((i) => i.repo.toLowerCase() === repo.toLowerCase());
    },
    add(repo) {
      const data = read();
      if (!data.items.some((i) => i.repo.toLowerCase() === repo.toLowerCase())) {
        data.items.push({ repo, addedAt: new Date().toISOString() });
        write(data);
      }
      return this.list();
    },
    remove(repo) {
      const data = read();
      data.items = data.items.filter((i) => i.repo.toLowerCase() !== repo.toLowerCase());
      write(data);
      return this.list();
    },
  };
}
