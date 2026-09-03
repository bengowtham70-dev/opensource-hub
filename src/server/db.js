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
  `);
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
