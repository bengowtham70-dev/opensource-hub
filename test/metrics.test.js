import assert from "node:assert/strict";
import { test } from "node:test";
import { getNpmDownloads, getPypiDownloads, getDockerPulls, getPairingMetrics } from "../src/server/metrics.js";

function fakeFetch(routes) {
  return async (url) => {
    for (const [match, body, status = 200] of routes) {
      if (String(url).includes(match)) {
        if (status !== 200) return new Response("no", { status });
        return new Response(JSON.stringify(body), { status: 200 });
      }
    }
    return new Response("not found", { status: 404 });
  };
}

test("npm bulk: unscoped names resolved from point endpoint", async () => {
  const fetchImpl = fakeFetch([
    [
      "downloads/point/last-month/joplin",
      { package: "joplin", downloads: 123456 },
    ],
  ]);
  const m = await getNpmDownloads(["joplin"], fetchImpl);
  assert.equal(m.get("joplin"), 123456);
});

test("npm scoped packages bypass the bulk endpoint (encoded, individual)", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    if (String(url).includes("@scope%2Fpkg") || String(url).includes("@scope/pkg")) {
      return new Response(JSON.stringify({ downloads: 777 }), { status: 200 });
    }
    return new Response("bad", { status: 404 });
  };
  const m = await getNpmDownloads(["@scope/pkg"], fetchImpl);
  assert.equal(m.get("@scope/pkg"), 777);
  // npm's downloads API serves scoped packages at the literal @scope/pkg path
  // (encodeURIComponent → %40/%2F 404s). One direct call, never the bulk list.
  assert.equal(urls.length, 1, "scoped package must be fetched individually");
  assert.ok(!urls[0].includes("%40") && !urls[0].includes("%2F"), "literal path form required");
});

test("npm bulk failure tolerated per slice", async () => {
  const fetchImpl = fakeFetch([["downloads/point", "no", 503]]);
  const m = await getNpmDownloads(["whatever"], fetchImpl);
  assert.equal(m.size, 0);
});

test("pypi via pypistats.org (NOT the dead PyPI JSON downloads field)", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ data: { last_month: 4200 } }), { status: 200 });
  };
  const v = await getPypiDownloads("somepkg", fetchImpl);
  assert.equal(v, 4200);
  assert.ok(urls[0].includes("pypistats.org/api/recent/somepkg"));
  assert.ok(urls.every((u) => !u.includes("pypi.org/pypi")), "must not use dead PyPI JSON API");
});

test("pypi failure returns null, never throws", async () => {
  const v = await getPypiDownloads("nope", fakeFetch([["pypistats", "no", 500]]));
  assert.equal(v, null);
});

test("docker pull_count with implicit library namespace", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ pull_count: 987654321 }), { status: 200 });
  };
  assert.equal(await getDockerPulls("penpot/app", fetchImpl), 987654321);
  assert.ok(urls[0].includes("/repositories/penpot/app/"));
  assert.equal(await getDockerPulls("redis", fetchImpl), 987654321);
  assert.ok(urls[1].includes("/repositories/library/redis/"));
});

test("getPairingMetrics aggregates only available sources", async () => {
  const fetchImpl = fakeFetch([
    ["downloads/point/last-month/joplin", { downloads: 50000 }],
    ["pypistats", { data: { last_month: 10 } }],
    ["hub.docker.com", { pull_count: 42 }],
  ]);
  const m = await getPairingMetrics({ npm: "joplin", docker: "some/image" }, fetchImpl);
  assert.deepEqual(m, { npm: 50000, docker: 42 });

  const empty = await getPairingMetrics({}, fetchImpl);
  assert.deepEqual(empty, {});
});
