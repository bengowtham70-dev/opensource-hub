// PRD Phase-2 item 6 (plans/PLAN_PHASE2.md P5) — popularity metrics normalizers.
// npm: bulk point endpoint, ≤128 packages per call, scoped packages fetched individually.
// PyPI: pypistats.org (PyPI JSON `downloads` field is DEAD — research-verified correction).
// Docker Hub: pull_count from the v2 API. All keyless; silent-fail to null per metric.
const TTL = 30 * 60 * 1000; // 30 min in-memory TTL
const cache = new Map();

function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.value);
  return fn().then((value) => {
    cache.set(key, { value, at: Date.now() });
    return value;
  });
}

async function getJson(url, fetchImpl, timeout = 8000) {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": "opensource-hub-cli" },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// Returns Map packageName → last-month downloads (missing entries = fetch failed).
export async function getNpmDownloads(packages, fetchImpl = globalThis.fetch) {
  const out = new Map();
  if (!packages?.length) return out;
  const plain = packages.filter((p) => !p.startsWith("@"));
  const scoped = packages.filter((p) => p.startsWith("@"));

  await Promise.all([
    // Bulk endpoint: unscoped names only, ≤128 per call.
    (async () => {
      for (let i = 0; i < plain.length; i += 128) {
        const slice = plain.slice(i, i + 128);
        try {
          const json = await getJson(
            `https://api.npmjs.org/downloads/point/last-month/${slice.join(",")}`,
            fetchImpl
          );
          // Bulk returns one object per package; single-name returns a bare object.
          // Defensive: some clients/caches strip `package` on single-name calls —
          // attribute a numeric bare response to the one requested name.
          const entries = Array.isArray(json) ? json : [json];
          for (const e of entries) {
            if (typeof e?.downloads !== "number") continue;
            out.set(e.package || slice[0], e.downloads);
          }
        } catch {
          /* per-slice failure tolerated */
        }
      }
    })(),
    // Scoped packages: individual calls only. npm's downloads endpoint expects
    // the literal "@scope/pkg" path form (encodeURIComponent would produce
    // %40/%2F and 404) — verified against api.npmjs.org behavior.
    ...scoped.map(async (name) => {
      try {
        const json = await getJson(
          `https://api.npmjs.org/downloads/point/last-month/${name}`,
          fetchImpl
        );
        if (typeof json.downloads === "number") out.set(name, json.downloads);
      } catch {
        /* tolerated */
      }
    }),
  ]);
  return out;
}

// pypistats.org — /api/recent/{pkg} → { data: { last_month, last_week, ... } }
export async function getPypiDownloads(packageName, fetchImpl = globalThis.fetch) {
  return cached(`pypi:${packageName}`, async () => {
    try {
      const json = await getJson(
        `https://pypistats.org/api/recent/${encodeURIComponent(packageName)}`,
        fetchImpl
      );
      return typeof json?.data?.last_month === "number" ? json.data.last_month : null;
    } catch {
      return null;
    }
  });
}

export async function getDockerPulls(image, fetchImpl = globalThis.fetch) {
  return cached(`docker:${image}`, async () => {
    try {
      const [namespace, repo = ""] = image.includes("/")
        ? image.split("/")
        : ["library", image];
      const json = await getJson(
        `https://hub.docker.com/v2/repositories/${encodeURIComponent(namespace)}/${encodeURIComponent(repo)}/`,
        fetchImpl
      );
      return typeof json.pull_count === "number" ? json.pull_count : null;
    } catch {
      return null;
    }
  });
}

// Aggregate entry point for a pairing's ecosystems object: { npm?, pypi?, docker? }
export async function getPairingMetrics(ecosystems = {}, fetchImpl = globalThis.fetch) {
  const metrics = {};
  const tasks = [];
  if (ecosystems.npm) {
    tasks.push(
      getNpmDownloads([ecosystems.npm], fetchImpl).then((m) => {
        if (m.has(ecosystems.npm)) metrics.npm = m.get(ecosystems.npm);
      })
    );
  }
  if (ecosystems.pypi) {
    tasks.push(
      getPypiDownloads(ecosystems.pypi, fetchImpl).then((v) => {
        if (v != null) metrics.pypi = v;
      })
    );
  }
  if (ecosystems.docker) {
    tasks.push(
      getDockerPulls(ecosystems.docker, fetchImpl).then((v) => {
        if (v != null) metrics.docker = v;
      })
    );
  }
  await Promise.all(tasks);
  return metrics;
}
