import test from "node:test";
import assert from "node:assert/strict";
import { generateCasaOsManifest, generateUnraidXml } from "../dashboard/src/lib/compose-generator.js";

const SAMPLE_TOOLS = [
  {
    alternative: {
      name: "Supabase",
      repo: "supabase/supabase",
      defaultPort: 54321,
      dockerImage: "supabase/studio:latest",
    },
    paidTool: { name: "Firebase" },
  },
  {
    alternative: {
      name: "Umami",
      repo: "umami-software/umami",
      defaultPort: 3000,
      dockerImage: "ghcr.io/umami-software/umami:postgresql-latest",
    },
    paidTool: { name: "Google Analytics" },
  },
];

test("NAS Manifest: generateCasaOsManifest produces valid JSON with correct structure", () => {
  const jsonStr = generateCasaOsManifest(SAMPLE_TOOLS);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.version, "1.0");
  assert.ok(parsed.title.en_us.includes("Supabase"));
  assert.ok(parsed.title.en_us.includes("Umami"));
  assert.equal(parsed.developer, "OpenSource Hub");
  assert.ok(Array.isArray(parsed.services));
  assert.equal(parsed.services.length, 2);

  const s1 = parsed.services[0];
  assert.equal(s1.name, "supabase");
  assert.equal(s1.image, "supabase/studio:latest");
  assert.ok(s1.ports.length > 0);
  assert.ok(s1.volumes.length > 0);
});

test("NAS Manifest: generateUnraidXml produces valid Unraid XML template", () => {
  const xml = generateUnraidXml(SAMPLE_TOOLS);

  assert.ok(xml.startsWith('<?xml version="1.0"?>'));
  assert.ok(xml.includes('<Container version="2">'));
  assert.ok(xml.includes('<Name>OpenSource-Hub-Stack</Name>'));
  assert.ok(xml.includes('<Repository>supabase/studio:latest</Repository>'));
  assert.ok(xml.includes('<Config Name="Supabase Web Port"'));
  assert.ok(xml.includes('<Config Name="Umami Web Port"'));
  assert.ok(xml.includes('<Config Name="Supabase Data Storage"'));
  assert.ok(xml.includes('</Container>'));
});
