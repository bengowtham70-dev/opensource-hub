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

export function createReviewStore({ dir = process.env.OSH_DATA_DIR || getUserDataDir(), seed = true } = {}) {
  const file = path.join(dir, "reviews.json");
  const SCHEMA_VERSION = 1;
  const MAX_REVIEWS_PER_REPO = 100;

  const INITIAL_SEED = {
    "supabase/supabase": [
      {
        id: "rev_seed_1",
        repo: "supabase/supabase",
        rating: 5,
        author: "Alex K.",
        role: "Infrastructure Lead",
        switchedFrom: "Firebase",
        summary: "Rock solid PostgreSQL platform with instant auth and realtime",
        content: "Migrated our core stack from Firebase. Saving over $600/month. The migration runbook and Docker compose setup was seamless.",
        pros: ["Full Postgres power", "Native pgvector support", "Excellent auth & studio UI"],
        cons: ["Requires at least 2GB RAM", "Kong and Studio require proper initial env configuration"],
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        helpful: 28,
      },
      {
        id: "rev_seed_2",
        repo: "supabase/supabase",
        rating: 5,
        author: "David L.",
        role: "Fullstack Engineer",
        switchedFrom: "AWS Amplify",
        summary: "Production-ready BaaS without vendor lock-in",
        content: "We run Supabase in production handling over 2M requests/day. Unmatched developer ergonomics and zero vendor pricing surprises.",
        pros: ["Row-Level Security (RLS) is first-class", "Built-in edge functions", "SQL migrations"],
        cons: ["Multi-container setup needs memory tuning under high load"],
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        helpful: 14,
      }
    ],
    "pocketbase/pocketbase": [
      {
        id: "rev_seed_3",
        repo: "pocketbase/pocketbase",
        rating: 5,
        author: "Devon M.",
        role: "Solo Founder",
        switchedFrom: "Firebase",
        summary: "Single binary perfection for MVPs and lightweight internal tools",
        content: "PocketBase is the quickest backend to spin up. Zero devops overhead, running comfortably on a $4/month VPS.",
        pros: ["Uses only 25MB RAM", "Embedded SQLite with WAL", "Admin dashboard out of the box"],
        cons: ["Single-node only; not suited for multi-region horizontal scaling"],
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        helpful: 19,
      }
    ],
    "dani-garcia/vaultwarden": [
      {
        id: "rev_seed_5",
        repo: "dani-garcia/vaultwarden",
        rating: 5,
        author: "Marcus R.",
        role: "Homelab Admin",
        switchedFrom: "1Password",
        summary: "Tiny Rust binary compatible with all official Bitwarden apps",
        content: "Running for 3 years without a single crash. The best self-hosted password manager hands down.",
        pros: ["Extremely low memory footprint (<40MB RAM)", "Works with official Bitwarden extensions & mobile apps"],
        cons: ["Must configure automated SQLite backup scripts and SSL reverse proxy"],
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        helpful: 42,
      }
    ],
    "mattermost/mattermost": [
      {
        id: "rev_seed_6",
        repo: "mattermost/mattermost",
        rating: 4,
        author: "Elena P.",
        role: "DevOps Lead",
        switchedFrom: "Slack",
        summary: "Enterprise Slack alternative with deep GitLab and webhook integrations",
        content: "Replaced Slack for 150 developers. Compliance audits and internal messaging are now completely under our control.",
        pros: ["Threaded discussions", "Compliance logging", "Full data sovereignty"],
        cons: ["Heavy memory footprint compared to Zulip", "Requires dedicated PostgreSQL instance"],
        createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
        helpful: 15,
      }
    ]
  };

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION && raw.reviews) {
        if (seed) {
          let modified = false;
          for (const [k, v] of Object.entries(INITIAL_SEED)) {
            if (!raw.reviews[k] || raw.reviews[k].length === 0) {
              raw.reviews[k] = v;
              modified = true;
            }
          }
          if (modified) {
            try { write(raw); } catch {}
          }
        }
        return raw;
      }
    } catch {
      // Return fresh schema on first run or corruption
    }
    const fresh = { schemaVersion: SCHEMA_VERSION, reviews: seed ? { ...INITIAL_SEED } : {} };
    try {
      write(fresh);
    } catch {}
    return fresh;
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

    voteHelpful(repo, id) {
      const data = read();
      const key = repo.toLowerCase();
      const list = data.reviews[key] || [];
      const item = list.find((r) => r.id === id);
      if (item) {
        item.helpful = (item.helpful || 0) + 1;
        write(data);
        return { success: true, helpful: item.helpful };
      }
      return { success: false, helpful: 0 };
    },
  };
}
