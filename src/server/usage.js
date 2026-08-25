// PRD §16 / PLAN_PHASE2 P10 — privacy-respecting usage measurement.
// Counters are STRICTLY LOCAL: stored in the user-data dir, never transmitted.
// There is no telemetry endpoint and no network call anywhere in this module.
// If remote analytics are ever added they MUST be opt-in via
// OPENSOURCE_HUB_TELEMETRY=1 and disclosed in the privacy policy first.
import fs from "node:fs";
import path from "node:path";

const SCHEMA_VERSION = 1;

export function createUsageStore({ dir = process.env.OSH_DATA_DIR } = {}) {
  if (!dir) return { increment() {}, get() { return { runs: 0 }; } };
  const file = path.join(dir, "usage.json");

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION) return raw;
    } catch {
      /* first run */
    }
    return { schemaVersion: SCHEMA_VERSION, runs: 0, firstRunAt: null, lastRunAt: null };
  }

  return {
    increment() {
      const data = read();
      data.runs += 1;
      data.lastRunAt = new Date().toISOString();
      if (!data.firstRunAt) data.firstRunAt = data.lastRunAt;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return data;
    },
    get() {
      const { schemaVersion, ...rest } = read();
      return rest;
    },
  };
}
