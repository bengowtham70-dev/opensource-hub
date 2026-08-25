// F8 (plans/PLAN_FEATURES.md) — saved trust audits + CSV export (PRD §20/§22).
// Local-only, schema-versioned, capped. Payment wiring deferred; surfaces
// unlocked free locally until a processor exists (documented decision).
import fs from "node:fs";
import path from "node:path";

const SCHEMA_VERSION = 1;
const CAP = 50;

export function createAuditStore({ dir = process.env.OSH_DATA_DIR } = {}) {
  const file = dir ? path.join(dir, "audits.json") : null;

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION && Array.isArray(raw.items)) return raw;
    } catch {
      /* first run */
    }
    return { schemaVersion: SCHEMA_VERSION, items: [] };
  }

  function write(data) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    save(audit) {
      const entry = {
        repo: String(audit.repo || ""),
        score: Number(audit.score) || 0,
        band: String(audit.band || ""),
        savedAt: new Date().toISOString(),
        signals: (audit.signals || []).map((s) => ({
          key: String(s.key || ""),
          label: String(s.label || ""),
          points: Number(s.points) || 0,
          detail: String(s.detail || ""),
        })),
      };
      // GitHub owner/repo names can't start with a dot — reject traversal-looking keys.
      if (!/^[a-z0-9][\w.-]*\/[\w.-]+$/i.test(entry.repo)) throw new Error("invalid repo");
      const data = read();
      data.items = data.items.filter((i) => i.repo !== entry.repo); // latest audit per repo
      data.items.unshift(entry);
      data.items = data.items.slice(0, CAP);
      write(data);
      return entry;
    },

    list() {
      return read().items;
    },

    get(repo) {
      return read().items.find((i) => i.repo === repo) || null;
    },

    remove(repo) {
      const data = read();
      data.items = data.items.filter((i) => i.repo !== repo);
      write(data);
      return data.items;
    },
  };
}

// PRD §20 — exportable comparison/audit report as CSV (procurement-ticket friendly).
// Formula-injection guard: cells starting with = + - @ get a leading apostrophe
// so Excel/LibreOffice treat them as text, not formulas (OWASP CSV guidance).
function safeCell(value) {
  const s = String(value ?? "");
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

export function auditToCsv(audit) {
  const esc = (v) => `"${String(safeCell(v)).replace(/"/g, '""')}"`;
  const rows = [
    ["field", "value"],
    ["repository", audit.repo],
    ["trust_score", audit.score],
    ["band", audit.band],
    ["saved_at", audit.savedAt],
    [],
    ["signal", "points", "detail"],
    ...audit.signals.map((s) => [s.label, s.points, s.detail]),
  ];
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
