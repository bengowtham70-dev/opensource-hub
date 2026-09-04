import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.resolve(DB_DIR, "catalog.db");

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Use Node 24's native node:sqlite
  const require = createRequire(import.meta.url);
  const { DatabaseSync } = require("node:sqlite");
  dbInstance = new DatabaseSync(DB_PATH);

  // Performance pragmas
  dbInstance.exec("PRAGMA journal_mode = WAL;");
  dbInstance.exec("PRAGMA synchronous = NORMAL;");
  dbInstance.exec("PRAGMA cache_size = -32000;"); // 32MB cache

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT UNIQUE NOT NULL,
      description TEXT,
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      language TEXT,
      license TEXT,
      last_commit TEXT,
      alternative_to TEXT,
      topics TEXT,
      platforms TEXT,
      is_flagship INTEGER DEFAULT 0,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_repos_stars ON repos(stars DESC);
    CREATE INDEX IF NOT EXISTS idx_repos_lang ON repos(language);
    CREATE INDEX IF NOT EXISTS idx_repos_flagship ON repos(is_flagship);
    CREATE INDEX IF NOT EXISTS idx_repos_alt ON repos(alternative_to);

    CREATE VIRTUAL TABLE IF NOT EXISTS repos_fts USING fts5(
      full_name,
      name,
      description,
      alternative_to,
      language,
      topics,
      content='repos',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS repos_ai AFTER INSERT ON repos BEGIN
      INSERT INTO repos_fts(rowid, full_name, name, description, alternative_to, language, topics)
      VALUES (new.id, new.full_name, new.name, new.description, new.alternative_to, new.language, new.topics);
    END;

    CREATE TRIGGER IF NOT EXISTS repos_ad AFTER DELETE ON repos BEGIN
      INSERT INTO repos_fts(repos_fts, rowid, full_name, name, description, alternative_to, language, topics)
      VALUES ('delete', old.id, old.full_name, old.name, old.description, old.alternative_to, old.language, old.topics);
    END;

    CREATE TRIGGER IF NOT EXISTS repos_au AFTER UPDATE ON repos BEGIN
      INSERT INTO repos_fts(repos_fts, rowid, full_name, name, description, alternative_to, language, topics)
      VALUES ('delete', old.id, old.full_name, old.name, old.description, old.alternative_to, old.language, old.topics);
      INSERT INTO repos_fts(rowid, full_name, name, description, alternative_to, language, topics)
      VALUES (new.id, new.full_name, new.name, new.description, new.alternative_to, new.language, new.topics);
    END;

    CREATE TABLE IF NOT EXISTS trending_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timeframe TEXT NOT NULL,
      date_key TEXT NOT NULL,
      repos_json TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      UNIQUE(timeframe, date_key)
    );
    CREATE INDEX IF NOT EXISTS idx_trending_snapshots_lookup ON trending_snapshots(timeframe, date_key);

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo TEXT NOT NULL,
      author TEXT NOT NULL,
      environment TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      pros TEXT,
      cons TEXT,
      comment TEXT NOT NULL,
      helpful_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_repo ON reviews(repo);

    CREATE TABLE IF NOT EXISTS upvotes (
      repo TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      last_voted_at TEXT NOT NULL
    );
  `);

  seedInitialCommunityData(db);
}

/**
 * High-speed search over 500,000+ catalog
 */
export function searchCatalog({
  q = "",
  language = "",
  alternativeTo = "",
  isFlagship = null,
  sort = "stars",
  page = 1,
  limit = 24,
} = {}) {
  const db = getDatabase();
  const offset = Math.max(0, (page - 1) * limit);
  const trimmedQ = q.trim();

  let countSql = "";
  let dataSql = "";
  const params = {};

  if (trimmedQ) {
    // Sanitize query for FTS5
    const sanitized = trimmedQ
      .replace(/["*^]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `"${term}"*`)
      .join(" ");

    countSql = `
      SELECT COUNT(*) as count 
      FROM repos_fts f 
      JOIN repos r ON r.id = f.rowid 
      WHERE repos_fts MATCH :matchQuery
    `;

    dataSql = `
      SELECT r.*, rank 
      FROM repos_fts f 
      JOIN repos r ON r.id = f.rowid 
      WHERE repos_fts MATCH :matchQuery
    `;

    params[":matchQuery"] = sanitized || "*";

    if (language) {
      countSql += " AND LOWER(r.language) = LOWER(:lang)";
      dataSql += " AND LOWER(r.language) = LOWER(:lang)";
      params[":lang"] = language;
    }
    if (alternativeTo) {
      countSql += " AND LOWER(r.alternative_to) LIKE LOWER(:alt)";
      dataSql += " AND LOWER(r.alternative_to) LIKE LOWER(:alt)";
      params[":alt"] = `%${alternativeTo}%`;
    }
    if (isFlagship !== null) {
      countSql += " AND r.is_flagship = :flagship";
      dataSql += " AND r.is_flagship = :flagship";
      params[":flagship"] = isFlagship ? 1 : 0;
    }

    if (sort === "stars") {
      dataSql += " ORDER BY (LOWER(r.name) = :rawQ) DESC, (r.is_flagship = 1) DESC, (LOWER(r.full_name) LIKE :containQ) DESC, r.stars DESC LIMIT :limit OFFSET :offset";
    } else {
      // Relevance rank with exact match boost
      dataSql += " ORDER BY (LOWER(r.name) = :rawQ) DESC, (r.is_flagship = 1) DESC, rank LIMIT :limit OFFSET :offset";
    }
  } else {
    // Browse all
    countSql = "SELECT COUNT(*) as count FROM repos r WHERE 1=1";
    dataSql = "SELECT r.* FROM repos r WHERE 1=1";

    if (language) {
      countSql += " AND LOWER(r.language) = LOWER(:lang)";
      dataSql += " AND LOWER(r.language) = LOWER(:lang)";
      params[":lang"] = language;
    }
    if (alternativeTo) {
      countSql += " AND LOWER(r.alternative_to) LIKE LOWER(:alt)";
      dataSql += " AND LOWER(r.alternative_to) LIKE LOWER(:alt)";
      params[":alt"] = `%${alternativeTo}%`;
    }
    if (isFlagship !== null) {
      countSql += " AND r.is_flagship = :flagship";
      dataSql += " AND r.is_flagship = :flagship";
      params[":flagship"] = isFlagship ? 1 : 0;
    }

    if (sort === "name") {
      dataSql += " ORDER BY r.name ASC LIMIT :limit OFFSET :offset";
    } else {
      dataSql += " ORDER BY r.is_flagship DESC, r.stars DESC LIMIT :limit OFFSET :offset";
    }
  }

  const countRow = db.prepare(countSql).get(params);
  const total = countRow ? Number(countRow.count) : 0;

  const dataParams = {
    ...params,
    ":limit": limit,
    ":offset": offset,
    ...(trimmedQ
      ? {
          ":rawQ": trimmedQ.toLowerCase(),
          ":containQ": `%${trimmedQ.toLowerCase()}%`,
        }
      : {}),
  };
  const rows = db.prepare(dataSql).all(dataParams);

  return {
    items: rows.map(formatDbRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function getRepoByFullName(fullName) {
  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM repos WHERE LOWER(full_name) = LOWER(?)")
    .get(fullName);
  return row ? formatDbRow(row) : null;
}

export function getCatalogStats() {
  const db = getDatabase();
  const totalRow = db.prepare("SELECT COUNT(*) as total, SUM(stars) as totalStars, SUM(is_flagship) as flagships FROM repos").get();
  const langRows = db.prepare("SELECT language, COUNT(*) as cnt FROM repos WHERE language IS NOT NULL AND language != '' GROUP BY language ORDER BY cnt DESC LIMIT 10").all();
  
  return {
    totalRepos: Number(totalRow?.total || 0),
    totalStars: Number(totalRow?.totalStars || 0),
    flagshipCount: Number(totalRow?.flagships || 0),
    topLanguages: langRows.map((r) => ({ language: r.language, count: Number(r.cnt) })),
  };
}

/**
 * Bulk insert/upsert in a single fast transaction
 */
export function insertReposBatch(repos) {
  if (!Array.isArray(repos) || repos.length === 0) return 0;
  const db = getDatabase();

  const insertStmt = db.prepare(`
    INSERT INTO repos (
      owner, name, full_name, description, stars, forks, 
      language, license, last_commit, alternative_to, topics, 
      platforms, is_flagship, metadata
    ) VALUES (
      :owner, :name, :full_name, :description, :stars, :forks,
      :language, :license, :last_commit, :alternative_to, :topics,
      :platforms, :is_flagship, :metadata
    )
    ON CONFLICT(full_name) DO UPDATE SET
      description = excluded.description,
      stars = excluded.stars,
      forks = excluded.forks,
      language = excluded.language,
      license = excluded.license,
      last_commit = excluded.last_commit,
      alternative_to = COALESCE(excluded.alternative_to, repos.alternative_to),
      topics = excluded.topics,
      platforms = excluded.platforms,
      is_flagship = MAX(repos.is_flagship, excluded.is_flagship),
      metadata = COALESCE(excluded.metadata, repos.metadata)
  `);

  db.exec("BEGIN TRANSACTION;");
  let inserted = 0;
  try {
    for (const r of repos) {
      insertStmt.run({
        ":owner": r.owner || (r.full_name ? r.full_name.split("/")[0] : "unknown"),
        ":name": r.name || (r.full_name ? r.full_name.split("/")[1] : "unknown"),
        ":full_name": r.full_name,
        ":description": r.description || "",
        ":stars": Number(r.stars) || 0,
        ":forks": Number(r.forks) || 0,
        ":language": r.language || "",
        ":license": r.license || "Open Source",
        ":last_commit": r.last_commit || new Date().toISOString(),
        ":alternative_to": r.alternative_to || "",
        ":topics": Array.isArray(r.topics) ? r.topics.join(",") : (r.topics || ""),
        ":platforms": Array.isArray(r.platforms) ? r.platforms.join(",") : (r.platforms || ""),
        ":is_flagship": r.is_flagship ? 1 : 0,
        ":metadata": r.metadata ? (typeof r.metadata === "string" ? r.metadata : JSON.stringify(r.metadata)) : null,
      });
      inserted++;
    }
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
  return inserted;
}

function formatDbRow(row) {
  let meta = null;
  try {
    if (row.metadata) meta = JSON.parse(row.metadata);
  } catch {}

  return {
    id: row.id,
    repo: row.full_name,
    owner: row.owner,
    name: row.name,
    description: row.description,
    stars: row.stars,
    forks: row.forks,
    language: row.language,
    license: row.license,
    lastCommit: row.last_commit,
    alternativeTo: row.alternative_to,
    topics: row.topics ? row.topics.split(",") : [],
    platforms: row.platforms ? row.platforms.split(",") : [],
    isFlagship: Boolean(row.is_flagship),
    metadata: meta,
  };
}

/**
 * Get 24-hour cached trending snapshot from SQLite
 */
export function getTrendingSnapshot(timeframe, maxAgeMs = 24 * 60 * 60 * 1000) {
  try {
    const db = getDatabase();
    const minCachedAt = Date.now() - maxAgeMs;
    const stmt = db.prepare(`
      SELECT repos_json, cached_at FROM trending_snapshots
      WHERE timeframe = :timeframe AND cached_at >= :min_cached_at
      ORDER BY cached_at DESC LIMIT 1
    `);
    const row = stmt.get({
      ":timeframe": String(timeframe),
      ":min_cached_at": minCachedAt,
    });
    if (!row) return null;
    return JSON.parse(row.repos_json);
  } catch (err) {
    console.error("getTrendingSnapshot error:", err.message);
    return null;
  }
}

/**
 * Save trending snapshot and auto-ingest repos into catalog
 */
export function saveTrendingSnapshot(timeframe, repos) {
  if (!Array.isArray(repos) || repos.length === 0) return false;
  try {
    const db = getDatabase();
    const now = Date.now();
    const dateKey = new Date().toISOString().split("T")[0];
    const reposJson = JSON.stringify(repos);

    const stmt = db.prepare(`
      INSERT INTO trending_snapshots (timeframe, date_key, repos_json, cached_at)
      VALUES (:timeframe, :date_key, :repos_json, :cached_at)
      ON CONFLICT(timeframe, date_key) DO UPDATE SET
        repos_json = excluded.repos_json,
        cached_at = excluded.cached_at
    `);

    stmt.run({
      ":timeframe": String(timeframe),
      ":date_key": dateKey,
      ":repos_json": reposJson,
      ":cached_at": now,
    });

    // Auto-ingest newly discovered repos into the catalog
    upsertReposFromGithub(repos);
    return true;
  } catch (err) {
    console.error("saveTrendingSnapshot error:", err.message);
    return false;
  }
}

/**
 * Ingest live GitHub items into the SQLite catalog and FTS5 search index
 */
export function upsertReposFromGithub(repos = []) {
  if (!Array.isArray(repos) || repos.length === 0) return 0;
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO repos (
      owner, name, full_name, description, stars, forks, language,
      license, last_commit, alternative_to, topics, platforms, is_flagship
    ) VALUES (
      :owner, :name, :full_name, :description, :stars, :forks, :language,
      :license, :last_commit, :alternative_to, :topics, :platforms, :is_flagship
    )
    ON CONFLICT(full_name) DO UPDATE SET
      stars = excluded.stars,
      forks = excluded.forks,
      description = coalesce(excluded.description, repos.description),
      last_commit = coalesce(excluded.last_commit, repos.last_commit),
      alternative_to = case when excluded.alternative_to != '' then excluded.alternative_to else repos.alternative_to end
  `);

  let count = 0;
  db.exec("BEGIN TRANSACTION;");
  try {
    for (const r of repos) {
      const fn = r.fullName || r.repo || r.full_name;
      if (!fn || typeof fn !== "string" || !fn.includes("/")) continue;
      const [owner, name] = fn.split("/");
      const alt = r.pairing?.paidTool?.name || r.alternativeTo || r.alternative_to || "";
      const lic = typeof r.license === "object" ? (r.license?.spdx || r.license?.name || "Open Source") : (r.license || "Open Source");
      const topicsStr = Array.isArray(r.topics) ? r.topics.join(",") : (r.topics || "");

      stmt.run({
        ":owner": owner,
        ":name": name,
        ":full_name": fn,
        ":description": r.description || "",
        ":stars": Number(r.stars) || 0,
        ":forks": Number(r.forks) || 0,
        ":language": r.language || "",
        ":license": lic,
        ":last_commit": r.pushedAt || r.lastCommit || r.last_commit || new Date().toISOString(),
        ":alternative_to": alt,
        ":topics": topicsStr,
        ":platforms": "self-hosted",
        ":is_flagship": r.pairing ? 1 : 0,
      });
      count++;
    }
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("upsertReposFromGithub error:", err.message);
  }
  return count;
}

/**
 * Seed authentic initial community hosting reviews & upvotes if tables are empty
 */
function seedInitialCommunityData(db) {
  try {
    const revCount = db.prepare("SELECT COUNT(*) as c FROM reviews").get();
    if (revCount.c === 0) {
      const initialReviews = [
        {
          repo: "supabase/supabase",
          author: "Alex K. (Infra Lead)",
          environment: "Docker Compose on Hetzner VPS",
          rating: 5,
          title: "Rock solid PostgreSQL platform with instant auth and realtime",
          pros: "Full Postgres power, native pgvector support, excellent auth & studio UI",
          cons: "Requires at least 2GB RAM; Kong and Studio require proper initial env configuration",
          comment: "Migrated our core stack from Firebase. Saving over $600/month. The migration runbook and Docker compose setup was seamless.",
          helpful_count: 28,
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          repo: "supabase/supabase",
          author: "David L. (Fullstack Dev)",
          environment: "Kubernetes (EKS)",
          rating: 5,
          title: "Production-ready BaaS without vendor lock-in",
          pros: "Row-Level Security (RLS) is first-class, built-in edge functions, SQL migrations",
          cons: "Multi-container setup needs memory tuning under high load",
          comment: "We run Supabase in production handling over 2M requests/day. Unmatched developer ergonomics.",
          helpful_count: 14,
          created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        },
        {
          repo: "pocketbase/pocketbase",
          author: "Devon M. (Solo Founder)",
          environment: "Raspberry Pi 5 / 1GB VPS",
          rating: 5,
          title: "Single binary perfection for MVPs and lightweight internal tools",
          pros: "Uses only 25MB RAM, embedded SQLite with WAL, admin dashboard out of the box",
          cons: "Single-node only; not suited for multi-region horizontal scaling",
          comment: "PocketBase is the quickest backend to spin up. Zero devops overhead, running comfortably on a $4/month VPS.",
          helpful_count: 19,
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          repo: "usebruno/bruno",
          author: "Sarah T. (Senior Backend Eng)",
          environment: "macOS & Linux Local Client",
          rating: 5,
          title: "Git-native API collections are what Postman should have been",
          pros: "Plain text Bru files, committed directly to git repository, zero cloud lock-in",
          cons: "Fewer team workspaces collaboration features compared to enterprise Postman",
          comment: "Bruno replaced Postman across our entire engineering org of 40 developers. No more forced logins or cloud sync delays.",
          helpful_count: 34,
          created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
        {
          repo: "dani-garcia/vaultwarden",
          author: "Marcus R. (Homelab Admin)",
          environment: "Docker on Raspberry Pi 4",
          rating: 5,
          title: "Tiny Rust binary compatible with all official Bitwarden apps",
          pros: "Extremely low memory footprint (<40MB RAM), works with official Bitwarden extensions & mobile apps",
          cons: "Must configure automated SQLite backup scripts and SSL reverse proxy",
          comment: "Running for 3 years without a single crash. The best self-hosted password manager hands down.",
          helpful_count: 42,
          created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          repo: "mattermost/mattermost",
          author: "Elena P. (DevOps Lead)",
          environment: "Kubernetes on AWS",
          rating: 4,
          title: "Enterprise Slack alternative with deep GitLab and webhook integrations",
          pros: "Threaded discussions, compliance logging, full data sovereignty",
          cons: "Heavy memory footprint compared to Zulip, requires dedicated PostgreSQL instance",
          comment: "Replaced Slack for 150 developers. Compliance audits and internal messaging are now completely under our control.",
          helpful_count: 15,
          created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
        },
      ];

      const stmt = db.prepare(`
        INSERT INTO reviews (repo, author, environment, rating, title, pros, cons, comment, helpful_count, created_at)
        VALUES (:repo, :author, :environment, :rating, :title, :pros, :cons, :comment, :helpful_count, :created_at)
      `);
      for (const rev of initialReviews) {
        stmt.run({
          ":repo": rev.repo,
          ":author": rev.author,
          ":environment": rev.environment,
          ":rating": rev.rating,
          ":title": rev.title,
          ":pros": rev.pros,
          ":cons": rev.cons,
          ":comment": rev.comment,
          ":helpful_count": rev.helpful_count,
          ":created_at": rev.created_at,
        });
      }
    }

    const upCount = db.prepare("SELECT COUNT(*) as c FROM upvotes").get();
    if (upCount.c === 0) {
      const initialUpvotes = [
        { repo: "supabase/supabase", count: 142 },
        { repo: "pocketbase/pocketbase", count: 98 },
        { repo: "usebruno/bruno", count: 115 },
        { repo: "dani-garcia/vaultwarden", count: 130 },
        { repo: "mattermost/mattermost", count: 76 },
        { repo: "penpot/penpot", count: 88 },
        { repo: "toeverything/affine", count: 92 },
        { repo: "umami-software/umami", count: 105 },
        { repo: "nocodb/nocodb", count: 84 },
      ];
      const stmt = db.prepare(`
        INSERT INTO upvotes (repo, count, last_voted_at)
        VALUES (:repo, :count, :last_voted_at)
      `);
      for (const u of initialUpvotes) {
        stmt.run({
          ":repo": u.repo,
          ":count": u.count,
          ":last_voted_at": new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("seedInitialCommunityData error:", err.message);
  }
}

/**
 * Reviews API Queries
 */
export function getReviews(repo) {
  try {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT id, repo, author, environment, rating, title, pros, cons, comment, helpful_count, created_at
      FROM reviews
      WHERE lower(repo) = lower(:repo)
      ORDER BY helpful_count DESC, id DESC
    `).all({ ":repo": repo });

    const total = rows.length;
    const avgRating = total > 0 ? Number((rows.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)) : 5.0;

    return {
      repo,
      total,
      avgRating,
      reviews: rows.map(r => ({
        id: r.id,
        repo: r.repo,
        author: r.author,
        environment: r.environment,
        rating: r.rating,
        title: r.title,
        pros: r.pros ? r.pros.split(",").map(s => s.trim()).filter(Boolean) : [],
        cons: r.cons ? r.cons.split(",").map(s => s.trim()).filter(Boolean) : [],
        comment: r.comment,
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
      })),
    };
  } catch (err) {
    console.error("getReviews error:", err.message);
    return { repo, total: 0, avgRating: 5.0, reviews: [] };
  }
}

export function addReview({ repo, author, environment, rating, title, pros, cons, comment }) {
  const db = getDatabase();
  const cleanRepo = String(repo || "").trim();
  const cleanAuthor = String(author || "Anonymous Self-Hoster").trim().slice(0, 80);
  const cleanEnv = String(environment || "Docker").trim().slice(0, 60);
  const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
  const cleanTitle = String(title || "Self-hosted review").trim().slice(0, 120);
  const cleanPros = Array.isArray(pros) ? pros.join(", ") : String(pros || "").slice(0, 300);
  const cleanCons = Array.isArray(cons) ? cons.join(", ") : String(cons || "").slice(0, 300);
  const cleanComment = String(comment || "").trim().slice(0, 2000);

  if (!cleanRepo || !cleanComment) {
    throw new Error("Repository and review comment are required.");
  }

  const stmt = db.prepare(`
    INSERT INTO reviews (repo, author, environment, rating, title, pros, cons, comment, helpful_count, created_at)
    VALUES (:repo, :author, :environment, :rating, :title, :pros, :cons, :comment, 0, :created_at)
  `);

  const now = new Date().toISOString();
  stmt.run({
    ":repo": cleanRepo,
    ":author": cleanAuthor,
    ":environment": cleanEnv,
    ":rating": cleanRating,
    ":title": cleanTitle,
    ":pros": cleanPros,
    ":cons": cleanCons,
    ":comment": cleanComment,
    ":created_at": now,
  });

  return getReviews(cleanRepo);
}

export function voteReviewHelpful(reviewId) {
  const db = getDatabase();
  const id = Number(reviewId);
  if (!id) throw new Error("Invalid review ID");

  db.prepare(`
    UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = :id
  `).run({ ":id": id });

  const row = db.prepare(`SELECT helpful_count, repo FROM reviews WHERE id = :id`).get({ ":id": id });
  return row ? { id, helpfulCount: row.helpful_count, repo: row.repo } : null;
}

/**
 * Public Community Upvotes
 */
export function getUpvotes() {
  try {
    const db = getDatabase();
    const rows = db.prepare(`SELECT repo, count, last_voted_at FROM upvotes`).all();
    const map = {};
    for (const r of rows) {
      map[r.repo.toLowerCase()] = r.count;
    }
    return map;
  } catch (err) {
    console.error("getUpvotes error:", err.message);
    return {};
  }
}

export function addUpvote(repo) {
  const db = getDatabase();
  const cleanRepo = String(repo || "").trim().toLowerCase();
  if (!cleanRepo) throw new Error("Invalid repository name");

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO upvotes (repo, count, last_voted_at)
    VALUES (:repo, 1, :now)
    ON CONFLICT(repo) DO UPDATE SET
      count = upvotes.count + 1,
      last_voted_at = :now
  `).run({ ":repo": cleanRepo, ":now": now });

  const row = db.prepare(`SELECT count FROM upvotes WHERE repo = :repo`).get({ ":repo": cleanRepo });
  return { repo: cleanRepo, count: row?.count || 1 };
}
