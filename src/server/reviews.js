import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

function esc(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createReviewStore({ dir = process.env.OSH_DATA_DIR || getUserDataDir() } = {}) {
  const file = path.join(dir, "reviews.json");
  const SCHEMA_VERSION = 1;
  const MAX_REVIEWS_PER_REPO = 100;

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION) return raw;
    } catch {
      // Return fresh schema on first run or corruption
    }
    return { schemaVersion: SCHEMA_VERSION, reviews: {} };
  }

  function write(data) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    getReviews(repo) {
      const data = read();
      const key = repo.toLowerCase();
      const list = data.reviews[key] || [];

      const total = list.length;
      if (total === 0) {
        return {
          repo,
          averageRating: 0,
          total: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: [],
        };
      }

      const sum = list.reduce((acc, r) => acc + (r.rating || 0), 0);
      const averageRating = Number((sum / total).toFixed(1));
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      for (const r of list) {
        const rating = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        distribution[rating] = (distribution[rating] || 0) + 1;
      }

      return {
        repo,
        averageRating,
        total,
        distribution,
        reviews: [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      };
    },

    addReview(repo, { rating, author, role = "", switchedFrom = "", summary, content, pros = [], cons = [] }) {
      const numRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
      const cleanAuthor = String(author || "Anonymous Developer").trim().slice(0, 60);
      const cleanRole = String(role || "Developer").trim().slice(0, 80);
      const cleanSwitchedFrom = String(switchedFrom || "").trim().slice(0, 60);
      const cleanSummary = String(summary || "").trim().slice(0, 140);
      const cleanContent = String(content || "").trim().slice(0, 2000);

      if (!cleanSummary && !cleanContent) {
        throw new Error("Review must contain a summary or content");
      }

      const reviewItem = {
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        repo: String(repo).toLowerCase(),
        rating: numRating,
        author: esc(cleanAuthor),
        role: esc(cleanRole),
        switchedFrom: esc(cleanSwitchedFrom),
        summary: esc(cleanSummary || cleanContent.slice(0, 80)),
        content: esc(cleanContent),
        pros: Array.isArray(pros) ? pros.map((p) => esc(String(p).slice(0, 80))).filter(Boolean) : [],
        cons: Array.isArray(cons) ? cons.map((c) => esc(String(c).slice(0, 80))).filter(Boolean) : [],
        createdAt: new Date().toISOString(),
        helpful: 0,
      };

      const data = read();
      const key = repo.toLowerCase();
      const list = data.reviews[key] || [];

      list.unshift(reviewItem);
      if (list.length > MAX_REVIEWS_PER_REPO) {
        list.pop();
      }

      data.reviews[key] = list;
      write(data);

      return this.getReviews(repo);
    },
  };
}
