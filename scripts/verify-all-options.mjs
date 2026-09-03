import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createApp } from "../src/server/app.js";

async function main() {
  console.log("==================================================");
  console.log("  OPENSOURCE HUB: COMPLETE OPTION VERIFICATION   ");
  console.log("==================================================");

  const { app, hasBuild } = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}`);
  console.log(`Frontend build status: ${hasBuild ? "BUILT" : "NOT BUILT"}\n`);

  const results = [];

  function record(category, testName, passed, details = "") {
    results.push({ category, testName, passed, details });
    const mark = passed ? "✔ [PASS]" : "✖ [FAIL]";
    console.log(`${mark} [${category}] ${testName}${details ? " - " + details : ""}`);
  }

  async function testGet(urlPath, expectedStatus = 200, isJson = true) {
    try {
      const res = await fetch(`${baseUrl}${urlPath}`);
      if (res.status !== expectedStatus) {
        return { ok: false, error: `Expected status ${expectedStatus}, got ${res.status}` };
      }
      if (isJson) {
        const data = await res.json();
        return { ok: true, data };
      } else {
        const text = await res.text();
        return { ok: true, text };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function testPost(urlPath, body, expectedStatus = 200) {
    try {
      const res = await fetch(`${baseUrl}${urlPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status !== expectedStatus) {
        return { ok: false, error: `Expected status ${expectedStatus}, got ${res.status}` };
      }
      const data = await res.json();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  console.log("--- 1. Testing Core API Endpoints ---");

  // 1. Health
  {
    const res = await testGet("/api/health");
    record("API", "Health Check (/api/health)", res.ok && res.data.ok === true);
  }

  // 2. Trending Views
  {
    const resToday = await testGet("/api/trending/today");
    record("API", "Trending Today (/api/trending/today)", resToday.ok && Array.isArray(resToday.data.repos));
    const resWeek = await testGet("/api/trending/week");
    record("API", "Trending Week (/api/trending/week)", resWeek.ok && Array.isArray(resWeek.data.repos));
    const resMonth = await testGet("/api/trending/month");
    record("API", "Trending Month (/api/trending/month)", resMonth.ok && Array.isArray(resMonth.data.repos));
    const resLeast = await testGet("/api/trending/least");
    record("API", "Trending Under Radar (/api/trending/least)", resLeast.ok && Array.isArray(resLeast.data.repos));
  }

  // 3. Search & Facets
  {
    const resSearch = await testGet("/api/search?q=notion");
    record("API", "Search by Query (/api/search?q=notion)", resSearch.ok && Array.isArray(resSearch.data.results) && resSearch.data.results.length > 0);
    const resFilter = await testGet("/api/search?platform=self-hosted&license=permissive");
    record("API", "Search Facets (/api/search?platform=self-hosted&license=permissive)", resFilter.ok && Array.isArray(resFilter.data.results));
    const resGoal = await testGet("/api/search?goal=replace-slack");
    record("API", "Search by Goal (/api/search?goal=replace-slack)", resGoal.ok && Array.isArray(resGoal.data.results));
  }

  // 4. Repo Data & Trust Scores
  {
    const resRepo = await testGet("/api/repo/toeverything/affine");
    record("API", "Repo Detail Metadata (/api/repo/toeverything/affine)", resRepo.ok && !!resRepo.data.pairing);
    const resMetrics = await testGet("/api/metrics/toeverything/affine");
    record("API", "Repo Metrics (/api/metrics/toeverything/affine)", resMetrics.ok && typeof resMetrics.data.metrics === "object");
    const resSec = await testGet("/api/security/toeverything/affine");
    record("API", "Repo Security & OSV (/api/security/toeverything/affine)", resSec.ok);
    const resRel = await testGet("/api/releases/toeverything/affine");
    record("API", "Repo Releases Asset Check (/api/releases/toeverything/affine)", resRel.ok && typeof resRel.data.runnable === "boolean");
  }

  // 5. Stack Cost Audit & AI Finder
  {
    const resAudit = await testPost("/api/stack-audit", { input: "Slack\nNotion\nFigma" });
    record("API", "Stack Cost Audit (/api/stack-audit)", resAudit.ok && resAudit.data.totals?.savingsPerYearUsd > 0, `Savings: $${resAudit.data?.totals?.savingsPerYearUsd}/yr`);
    
    // Save Stack & Export
    const resSaveStack = await fetch(`${baseUrl}/api/stack-audit/saved`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: resAudit.data }),
    });
    record("API", "Stack Audit PUT (/api/stack-audit/saved)", resSaveStack.status === 200);

    const resGetSavedStack = await testGet("/api/stack-audit/saved");
    record("API", "Stack Audit Saved GET (/api/stack-audit/saved)", resGetSavedStack.ok && resGetSavedStack.data.report);

    const resExportCsv = await testGet("/api/stack-audit/saved/export", 200, false);
    record("API", "Stack Audit CSV Export (/api/stack-audit/saved/export)", resExportCsv.ok && resExportCsv.text.includes("paid_tool"));

    const resFinder = await testPost("/api/ai-find", { task: "I need an open source alternative to Slack" });
    record("API", "AI Alternative Finder (/api/ai-find)", resFinder.ok && Array.isArray(resFinder.data.results));
  }

  // 6. Global Releases Feed & Curated Lists
  {
    const resReleases = await testGet("/api/releases/feed");
    record("API", "Global Releases Feed (/api/releases/feed)", resReleases.ok && Array.isArray(resReleases.data.releases));
    const resLists = await testGet("/api/lists");
    record("API", "Curated Lists Index (/api/lists)", resLists.ok && Array.isArray(resLists.data));
    if (resLists.ok && resLists.data.length > 0) {
      const slug = resLists.data[0].slug;
      const resListDetail = await testGet(`/api/lists/${slug}`);
      record("API", `Curated List Detail (/api/lists/${slug})`, resListDetail.ok && Array.isArray(resListDetail.data.pairings));
    }
  }

  // 7. Collections & Goals
  {
    const resCollections = await testGet("/api/collections");
    record("API", "Auto-derived Collections (/api/collections)", resCollections.ok && resCollections.data.graveyard && resCollections.data.comingSoon);
    const resGoals = await testGet("/api/goals");
    record("API", "Goal Tags List (/api/goals)", resGoals.ok && Array.isArray(resGoals.data.goals));
  }

  // 8. Watchlist Check
  {
    const resCheck = await testPost("/api/watchlist-check", { repos: [{ repo: "toeverything/affine", lastScore: 80 }] });
    record("API", "Watchlist Check (/api/watchlist-check)", resCheck.ok && Array.isArray(resCheck.data.alerts));
  }

  // 9. Audits Store
  {
    const saveAudRes = await testPost("/api/audits/toeverything/affine", { score: 90, band: "strong", signals: [] });
    record("API", "Audit Save POST (/api/audits/:owner/:name)", saveAudRes.ok);
    const getAudList = await testGet("/api/audits");
    record("API", "Audits List GET (/api/audits)", getAudList.ok && Array.isArray(getAudList.data));
    const getAudItem = await testGet("/api/audits/toeverything/affine");
    record("API", "Audit Item GET (/api/audits/:owner/:name)", getAudItem.ok && getAudItem.data.repo === "toeverything/affine");
    const getAudCsv = await testGet("/api/audits/toeverything/affine/export", 200, false);
    record("API", "Audit Item CSV Export (/api/audits/:owner/:name/export)", getAudCsv.ok && getAudCsv.text.includes('"field"'));
  }

  // 10. Favorites Store
  {
    const resFavGet = await testGet("/api/favorites");
    record("API", "Favorites GET (/api/favorites)", resFavGet.ok && Array.isArray(resFavGet.data));
    const resFavAdd = await testPost("/api/favorites", { repo: "mattermost/mattermost" });
    record("API", "Favorites ADD (/api/favorites)", resFavAdd.ok);
    const resFavDel = await fetch(`${baseUrl}/api/favorites/mattermost/mattermost`, { method: "DELETE" });
    record("API", "Favorites DELETE (/api/favorites/:owner/:name)", resFavDel.status === 200);
  }

  // 11. Community Reviews & Community Store
  {
    const resRevGet = await testGet("/api/reviews/toeverything/affine");
    record("API", "Reviews GET (/api/reviews/:repo)", resRevGet.ok && Array.isArray(resRevGet.data.reviews));
    const resRevPost = await testPost("/api/reviews/toeverything/affine", {
      rating: 5,
      author: "OpenSourceTester",
      content: "Super smooth canvas experience!",
    });
    record("API", "Reviews POST (/api/reviews/:repo)", resRevPost.ok && Array.isArray(resRevPost.data.reviews));

    const commGet = await testGet("/api/community/toeverything/affine");
    record("API", "Community Data GET (/api/community/:repo)", commGet.ok);
    const commVote = await testPost("/api/community/toeverything/affine/vote", { choice: "yes" });
    record("API", "Community Vote POST (/api/community/:repo/vote)", commVote.ok);
  }

  // 12. Newsletter & CSV Export
  {
    const subRes = await testPost("/api/newsletter/subscribe", { email: "test-user@opensourcehub.org" });
    record("API", "Newsletter Subscribe (/api/newsletter/subscribe)", subRes.ok);
    const expRes = await testGet("/api/newsletter/export", 200, false);
    record("API", "Newsletter CSV Export (/api/newsletter/export)", expRes.ok && expRes.text.includes("Email,SubscribedAt"));
  }

  // 13. Maintainer Claim Verification
  {
    const claimRes = await testPost("/api/claim/toeverything/affine/verify", {});
    record("API", "Maintainer Claim Verification (/api/claim/:repo/verify)", claimRes.ok);
  }

  // 14. Dynamic Badges
  {
    const trustSvg = await testGet("/api/badge/toeverything/affine/trust.svg", 200, false);
    record("API", "Trust SVG Badge (/api/badge/.../trust.svg)", trustSvg.ok && trustSvg.text.includes("<svg"));
    const altSvg = await testGet("/api/badge/toeverything/affine/alternative.svg", 200, false);
    record("API", "Alternative SVG Badge (/api/badge/.../alternative.svg)", altSvg.ok && altSvg.text.includes("<svg"));
  }

  // 15. Multi-Forge Support (GitLab & Codeberg)
  {
    const gitlabRes = await testGet("/api/forge/gitlab/inkscape/inkscape");
    record("API", "Multi-Forge GitLab (/api/forge/gitlab/...)", gitlabRes.ok);
    const codebergRes = await testGet("/api/forge/codeberg/forgejo/forgejo");
    record("API", "Multi-Forge Codeberg (/api/forge/codeberg/...)", codebergRes.ok);
  }

  // 16. Click Tracker & Outbound Redirect
  {
    const trackRes = await testGet("/api/analytics/clicks");
    record("API", "Click Analytics GET (/api/analytics/clicks)", trackRes.ok && typeof trackRes.data.total === "number");
    const goRes = await fetch(`${baseUrl}/api/go/railway?repo=toeverything/affine&url=https://railway.app`, { redirect: "manual" });
    record("API", "Outbound Redirect Middleware (/api/go/railway)", goRes.status === 302);
  }

  // 17. Extension ZIP Package Download
  {
    const extRes = await fetch(`${baseUrl}/api/extension/download`);
    const isZip = extRes.status === 200 && extRes.headers.get("content-type")?.includes("zip");
    record("API", "Extension ZIP Streamer (/api/extension/download)", isZip);
  }

  // 18. Data Export & Import
  {
    const exportRes = await testGet("/api/export");
    record("API", "Local Data Export (/api/export)", exportRes.ok && exportRes.data.app === "opensource-hub");
    const importRes = await testPost("/api/import", {
      data: {
        app: "opensource-hub",
        schema: 1,
        exportedAt: new Date().toISOString(),
        favorites: [{ repo: "appflowy-io/appflowy" }],
        community: {},
      },
    });
    record("API", "Local Data Import (/api/import)", importRes.ok && importRes.data.importedFavorites >= 1);
  }

  // 19. Learn & Blog Content API
  {
    const learnRes = await testGet("/api/learn");
    record("API", "Learn Articles List (/api/learn)", learnRes.ok && Array.isArray(learnRes.data));
    const blogRes = await testGet("/api/blog");
    record("API", "Blog Posts List (/api/blog)", blogRes.ok && Array.isArray(blogRes.data));
  }

  // 20. Admin Moderation Queue
  {
    const adminRes = await testGet("/api/admin/queue");
    record("API", "Admin Queue GET (/api/admin/queue)", adminRes.ok && Array.isArray(adminRes.data.pending));
  }

  console.log("\n--- 2. Testing SPA Route Delivery ---");
  const spaRoutes = [
    "/",
    "/find",
    "/audits",
    "/stack-audit",
    "/lists",
    "/lists/privacy-first",
    "/watchlist",
    "/favorites",
    "/learn",
    "/learn/what-is-open-source",
    "/blog",
    "/blog/why-we-built-opensource-hub",
    "/mcp",
    "/releases",
    "/stacks",
    "/stacks/builder",
    "/licenses",
    "/alternatives",
    "/alternatives/slack",
    "/compare/mattermost/vs/zulip",
    "/categories",
    "/repo/toeverything/affine",
    "/submit",
    "/advertise",
    "/admin",
  ];

  for (const route of spaRoutes) {
    const res = await testGet(route, 200, false);
    const htmlHasRoot = res.ok && res.text.includes('<div id="root"></div>');
    record("SPA Delivery", `Route ${route}`, htmlHasRoot);
  }

  server.close();

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n==================================================");
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} PASSED (${failed} failed)`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
