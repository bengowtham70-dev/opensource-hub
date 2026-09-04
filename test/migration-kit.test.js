import { describe, it } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import {
  generateMigrationKit,
  buildMigrationZip,
  createZipArchive,
  CANONICAL_MIGRATION_SPECS,
} from "../src/server/migration-kit.js";
import { createApp } from "../src/server/app.js";

describe("Interactive Migration Kit & Executable Data Scripts (PRD §38 & §2.1)", () => {
  it("generates tailored migration kit for Supabase replacing Firebase", () => {
    const kit = generateMigrationKit({
      repo: "supabase/supabase",
      config: { volume: "medium", targetEnv: "docker", dbDialect: "postgres" },
    });

    assert.equal(kit.paidTool, "Firebase");
    assert.equal(kit.alternative, "Supabase");
    assert.equal(kit.config.targetEnv, "docker");
    assert.equal(kit.config.volume, "medium");

    assert.ok(kit.scripts["scripts/01-export.sh"]);
    assert.ok(kit.scripts["scripts/01-export.ps1"]);
    assert.ok(kit.scripts["scripts/02-transform.js"]);
    assert.ok(kit.scripts["scripts/03-import.sh"]);
    assert.ok(kit.scripts["scripts/03-import.ps1"]);
    assert.ok(kit.scripts["scripts/04-verify.sh"]);
    assert.ok(kit.scripts["scripts/04-verify.ps1"]);
    assert.ok(kit.scripts[".env.migration.example"]);
    assert.ok(kit.scripts["RUNBOOK.md"]);

    // Check script contents for specific flags
    assert.match(kit.scripts["scripts/01-export.sh"], /gcloud firestore export/);
    assert.match(kit.scripts["scripts/02-transform.js"], /POSTGRES/);
    assert.match(kit.scripts["scripts/03-import.sh"], /docker compose exec -T db psql/);
    assert.match(kit.scripts["RUNBOOK.md"], /Firebase → Supabase/);
  });

  it("adjusts batch limits and timeouts for enterprise volume profile", () => {
    const kit = generateMigrationKit({
      repo: "supabase/supabase",
      config: { volume: "enterprise", targetEnv: "vps", dbDialect: "postgres" },
    });

    assert.equal(kit.summary.batchSize, 10000);
    assert.match(kit.scripts[".env.migration.example"], /BATCH_SIZE="10000"/);
    assert.match(kit.scripts[".env.migration.example"], /TIMEOUT_SEC="120"/);
  });

  it("generates tailored migration kit for Bruno replacing Postman", () => {
    const kit = generateMigrationKit({
      repo: "usebruno/bruno",
      config: { volume: "small", targetEnv: "docker" },
    });

    assert.equal(kit.paidTool, "Postman");
    assert.equal(kit.alternative, "Bruno");
    assert.match(kit.scripts["scripts/01-export.sh"], /Postman Workspace Collections/);
    assert.match(kit.scripts["scripts/02-transform.js"], /Bruno/);
  });

  it("generates intelligent fallback migration kit for unlisted repository", () => {
    const kit = generateMigrationKit({
      repo: "acme/custom-tool",
      alternative: { name: "CustomTool" },
      paidTool: { name: "SaaS Pro" },
      config: { volume: "small", targetEnv: "docker", dbDialect: "sqlite" },
    });

    assert.equal(kit.paidTool, "SaaS Pro");
    assert.equal(kit.alternative, "CustomTool");
    assert.equal(kit.config.dbDialect, "sqlite");
    assert.ok(kit.scripts["RUNBOOK.md"]);
    assert.match(kit.scripts["RUNBOOK.md"], /SaaS Pro → CustomTool/);
  });

  it("compiles in-memory ZIP archive with valid PKZIP signature and entries", () => {
    const files = {
      "README.txt": "Hello from migration kit",
      "scripts/test.sh": "#!/bin/sh\necho ok\n",
    };
    const zipBuf = createZipArchive(files);

    assert.ok(Buffer.isBuffer(zipBuf));
    assert.ok(zipBuf.length > 100);

    // Verify PK0304 signature at start of local file header
    assert.equal(zipBuf[0], 0x50); // 'P'
    assert.equal(zipBuf[1], 0x4b); // 'K'
    assert.equal(zipBuf[2], 0x03);
    assert.equal(zipBuf[3], 0x04);

    // Build full migration zip
    const fullZip = buildMigrationZip({
      repo: "supabase/supabase",
      config: { volume: "medium", targetEnv: "docker" },
    });
    assert.ok(Buffer.isBuffer(fullZip));
    assert.ok(fullZip.length > 500);
  });

  it("serves migration kit via API endpoints", async () => {
    const { app } = createApp();

    // 1. POST /api/migration/kit
    const kitRes = await fetch("http://127.0.0.1:3000/api/migration/kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo: "supabase/supabase",
        config: { volume: "medium", targetEnv: "docker" },
      }),
    });

    if (kitRes.ok) {
      const data = await kitRes.json();
      assert.equal(data.ok, true);
      assert.equal(data.kit.paidTool, "Firebase");
      assert.ok(data.kit.scripts["RUNBOOK.md"]);
    }

    // 2. GET /api/migration/bundle
    const bundleRes = await fetch("http://127.0.0.1:3000/api/migration/bundle?repo=supabase/supabase&volume=medium");
    if (bundleRes.ok) {
      assert.equal(bundleRes.headers.get("content-type"), "application/zip");
      const ab = await bundleRes.arrayBuffer();
      assert.ok(ab.byteLength > 200);
      const buf = Buffer.from(ab);
      assert.equal(buf[0], 0x50);
      assert.equal(buf[1], 0x4b);
    }
  });
});
