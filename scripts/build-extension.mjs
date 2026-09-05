#!/usr/bin/env node
// scripts/build-extension.mjs
// Builds production-ready WebExtension ZIP bundles for Chrome Web Store, Mozilla Add-ons & Edge.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createExtensionZip } from "../src/server/extension-pack.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const outDir = path.join(projectRoot, "dist/extension");

export function buildExtensionPackages(version = "0.1.0") {
  fs.mkdirSync(outDir, { recursive: true });

  const browsers = [
    { id: "chrome", filename: `opensource-hub-chrome-v${version}.zip` },
    { id: "firefox", filename: `opensource-hub-firefox-v${version}.zip` },
    { id: "edge", filename: `opensource-hub-edge-v${version}.zip` },
  ];

  const results = [];
  let checksumFileContent = "";

  for (const b of browsers) {
    const zipBuf = createExtensionZip({ browser: b.id });
    const filePath = path.join(outDir, b.filename);
    fs.writeFileSync(filePath, zipBuf);

    const hash = crypto.createHash("sha256").update(zipBuf).digest("hex");
    const sizeKb = (zipBuf.length / 1024).toFixed(1);

    checksumFileContent += `${hash}  ${b.filename}\n`;
    results.push({ browser: b.id, filename: b.filename, sizeKb, hash });
  }

  fs.writeFileSync(path.join(outDir, "SHA256SUMS.txt"), checksumFileContent, "utf8");

  console.log(`\n=== Built ${results.length} Extension Packages in dist/extension ===`);
  for (const r of results) {
    console.log(`  ✓ ${r.browser.padEnd(8)}: ${r.filename} (${r.sizeKb} KB)`);
    console.log(`    sha256: ${r.hash}`);
  }

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  buildExtensionPackages("0.1.0");
}
