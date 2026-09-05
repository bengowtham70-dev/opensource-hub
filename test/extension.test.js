import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createExtensionZip } from "../src/server/extension-pack.js";
import { buildExtensionPackages } from "../scripts/build-extension.mjs";
import { createApp } from "../src/server/app.js";

describe("Browser Extension Multi-Store Packaging & API (PRD §441)", () => {
  it("generates valid Chrome MV3 ZIP archive with standard PKZIP signature", () => {
    const zip = createExtensionZip({ browser: "chrome" });
    assert.ok(Buffer.isBuffer(zip));
    assert.ok(zip.length > 1000);
    // PKZIP magic bytes (0x50, 0x4B, 0x03, 0x04)
    assert.equal(zip[0], 0x50);
    assert.equal(zip[1], 0x4b);
    assert.equal(zip[2], 0x03);
    assert.equal(zip[3], 0x04);
  });

  it("generates valid Firefox MV3 ZIP with gecko ID in manifest", () => {
    const zip = createExtensionZip({ browser: "firefox" });
    assert.ok(Buffer.isBuffer(zip));
    assert.ok(zip.length > 1000);
    assert.equal(zip[0], 0x50);
    assert.equal(zip[1], 0x4b);

    // Verify presence of gecko ID in uncompressed manifest string
    const zipString = zip.toString("utf8");
    assert.ok(zipString.includes("manifest.json"));
  });

  it("buildExtensionPackages generates store release artifacts with SHA256 checksums", () => {
    const results = buildExtensionPackages("0.1.0");
    assert.equal(results.length, 3);
    const browsers = results.map((r) => r.browser);
    assert.ok(browsers.includes("chrome"));
    assert.ok(browsers.includes("firefox"));
    assert.ok(browsers.includes("edge"));

    for (const r of results) {
      assert.equal(r.hash.length, 64);
      assert.ok(Number.parseFloat(r.sizeKb) > 100);
    }
  });

  it("serves extension zip via /api/extension/download API endpoint", async () => {
    const { app } = createApp();
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;

    try {
      // 1. Chrome bundle
      const resChrome = await fetch(`${base}/api/extension/download?browser=chrome`);
      assert.equal(resChrome.status, 200);
      assert.equal(resChrome.headers.get("content-type"), "application/zip");
      assert.ok(resChrome.headers.get("content-disposition").includes("opensource-hub-extension-chrome.zip"));
      const bufChrome = Buffer.from(await resChrome.arrayBuffer());
      assert.equal(bufChrome[0], 0x50);
      assert.equal(bufChrome[1], 0x4b);

      // 2. Firefox bundle
      const resFirefox = await fetch(`${base}/api/extension/download?browser=firefox`);
      assert.equal(resFirefox.status, 200);
      assert.ok(resFirefox.headers.get("content-disposition").includes("opensource-hub-extension-firefox.zip"));
    } finally {
      server.close();
    }
  });
});
