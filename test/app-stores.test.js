import test from "node:test";
import assert from "node:assert/strict";
import {
  getEligibleAppStoreApps,
  generateUmbrelAppStoreYaml,
  generateUmbrelAppManifest,
  generateUmbrelCompose,
  generateRuntipiConfig,
  generateCasaOsAppJson,
  generateUnraidAppXml,
  generateAppStoreFiles,
  buildAppStoreZip,
} from "../src/server/app-stores.js";

test("App Stores: retrieves eligible apps with Docker images", () => {
  const apps = getEligibleAppStoreApps();
  assert.ok(Array.isArray(apps));
  assert.ok(apps.length >= 10, "Should have at least 10 Docker-ready apps");

  const supabase = apps.find((a) => a.repo === "supabase/supabase");
  assert.ok(supabase, "Supabase should be in eligible apps");
  assert.equal(supabase.id, "supabase");
  assert.ok(supabase.image.includes("supabase"));
  assert.ok(typeof supabase.port === "number");
});

test("App Stores: generates valid UmbrelOS store and app manifests", () => {
  const storeYaml = generateUmbrelAppStoreYaml();
  assert.ok(storeYaml.includes("OpenSource Hub Community Store"));

  const sampleApp = {
    id: "supabase",
    name: "Supabase",
    tagline: "Open Source Firebase Alternative",
    description: "The open source Firebase alternative with Postgres, Auth, and Storage.",
    category: "Developer Tools",
    port: 8000,
    developer: "supabase",
    website: "https://github.com/supabase/supabase",
    image: "supabase/postgres:15.1.0.117",
  };

  const appYaml = generateUmbrelAppManifest(sampleApp);
  assert.ok(appYaml.includes("manifestVersion: 1"));
  assert.ok(appYaml.includes('id: "supabase"'));
  assert.ok(appYaml.includes("port: 8000"));

  const compose = generateUmbrelCompose(sampleApp);
  assert.ok(compose.includes('version: "3.7"'));
  assert.ok(compose.includes("image: \"supabase/postgres:15.1.0.117\""));
  assert.ok(compose.includes('"8000:8000"'));
});

test("App Stores: generates valid Runtipi, CasaOS, and Unraid manifests", () => {
  const sampleApp = {
    id: "bruno",
    name: "Bruno",
    replaces: "Postman",
    tagline: "Open Source Postman Alternative",
    description: "Fast and git-friendly API client.",
    category: "Developer Tools",
    port: 3000,
    developer: "usebruno",
    website: "https://github.com/usebruno/bruno",
    image: "usebruno/bruno:latest",
  };

  // Runtipi
  const config = JSON.parse(generateRuntipiConfig(sampleApp));
  assert.equal(config.id, "bruno");
  assert.equal(config.port, 3000);
  assert.ok(config.shortDesc.includes("Postman"));

  // CasaOS
  const casaOs = JSON.parse(generateCasaOsAppJson(sampleApp));
  assert.equal(casaOs.version, "1.0");
  assert.equal(casaOs.title.en_us, "Bruno");
  assert.equal(casaOs.services[0].image, "usebruno/bruno:latest");

  // Unraid
  const unraid = generateUnraidAppXml(sampleApp);
  assert.ok(unraid.includes('<Container version="2">'));
  assert.ok(unraid.includes("<Name>Bruno</Name>"));
  assert.ok(unraid.includes("<Repository>usebruno/bruno:latest</Repository>"));
});

test("App Stores: compiles in-memory ZIP package with valid PK signature", () => {
  const zipBuf = buildAppStoreZip("umbrel");
  assert.ok(Buffer.isBuffer(zipBuf));
  assert.ok(zipBuf.length > 500, "ZIP buffer should have substantial content");

  // Check PK signature 0x04034b50 (bytes 0x50, 0x4B, 0x03, 0x04)
  assert.equal(zipBuf[0], 0x50);
  assert.equal(zipBuf[1], 0x4b);
  assert.equal(zipBuf[2], 0x03);
  assert.equal(zipBuf[3], 0x04);
});
