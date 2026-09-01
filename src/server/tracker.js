import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

const DEFAULT_AFFILIATES = {
  digitalocean: { param: "refcode", value: "opensourcehub" },
  vercel: { param: "utm_source", value: "opensource-hub" },
  railway: { param: "referralCode", value: "opensourcehub" },
  supabase: { param: "ref", value: "opensourcehub" },
};

function getClicksFile(dir = getUserDataDir()) {
  return path.join(dir, "clicks.json");
}

export function createClickTracker({ dir = getUserDataDir(), affiliates = DEFAULT_AFFILIATES } = {}) {
  const file = getClicksFile(dir);

  function read() {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      }
    } catch {
      /* first run */
    }
    return { clicks: [] };
  }

  function write(data) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch {
      /* silent fallback */
    }
  }

  return {
    track({ target = "", repo = "", type = "outbound", referrer = "" }) {
      const data = read();
      const clickEvent = {
        id: Math.random().toString(36).slice(2, 9),
        target: String(target),
        repo: String(repo),
        type: String(type), // 'deploy', 'website', 'demo', 'github'
        referrer: String(referrer),
        timestamp: new Date().toISOString(),
      };
      data.clicks.push(clickEvent);
      // Keep last 1,000 clicks locally
      if (data.clicks.length > 1000) {
        data.clicks = data.clicks.slice(-1000);
      }
      write(data);
      return clickEvent;
    },

    getAnalytics() {
      const data = read();
      const total = data.clicks.length;
      const byType = {};
      const byTarget = {};
      const byRepo = {};

      for (const c of data.clicks) {
        byType[c.type] = (byType[c.type] || 0) + 1;
        if (c.target) byTarget[c.target] = (byTarget[c.target] || 0) + 1;
        if (c.repo) byRepo[c.repo] = (byRepo[c.repo] || 0) + 1;
      }

      return {
        total,
        byType,
        byTarget,
        byRepo,
        recent: data.clicks.slice(-20).reverse(),
      };
    },

    buildAffiliateUrl(rawUrl, providerName = "") {
      try {
        const url = new URL(rawUrl);
        const prov = providerName.toLowerCase();
        const aff = affiliates[prov];
        if (aff && aff.param && aff.value) {
          url.searchParams.set(aff.param, aff.value);
        }
        return url.toString();
      } catch {
        return rawUrl;
      }
    },
  };
}
