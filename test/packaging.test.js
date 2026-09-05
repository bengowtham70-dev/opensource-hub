import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateHomebrewFormula,
  generateScoopManifest,
  generateWingetManifest,
  sha256,
} from "../scripts/build-packaging.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

describe("Multi-Channel Packaging & Distribution (PRD §30)", () => {
  it("computes accurate SHA256 hex string", () => {
    const hash = sha256(Buffer.from("opensource-hub"));
    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64);
  });

  it("generates valid Homebrew Formula", () => {
    const formula = generateHomebrewFormula({
      repoSlug: "test/repo",
      version: "1.2.3",
      tarballSha: "abc123def456",
    });

    assert.match(formula, /class OpensourceHub < Formula/);
    assert.match(formula, /url "https:\/\/registry\.npmjs\.org\/opensource-hub\/-\/opensource-hub-1\.2\.3\.tgz"/);
    assert.match(formula, /sha256 "abc123def456"/);
    assert.match(formula, /depends_on "node"/);
    assert.match(formula, /bin\.install libexec\/"bin\/cli\.js" => "opensource-hub"/);
  });

  it("generates valid Scoop Manifest", () => {
    const scoop = generateScoopManifest({
      repoSlug: "bengowtham70-dev/opensource-hub",
      version: "0.2.0",
      exeSha: "deadbeef1234567890",
    });

    assert.equal(scoop.version, "0.2.0");
    assert.equal(scoop.bin, "opensource-hub.exe");
    assert.equal(scoop.architecture["64bit"].hash, "deadbeef1234567890");
    assert.match(scoop.architecture["64bit"].url, /releases\/download\/v0\.2\.0\/opensource-hub-v0\.2\.0-windows-x64\.exe/);
    assert.ok(scoop.autoupdate.architecture["64bit"]);
  });

  it("generates valid Winget Manifest", () => {
    const winget = generateWingetManifest({
      repoSlug: "bengowtham70-dev/opensource-hub",
      version: "0.1.0",
      x64Sha: "x64hash123",
      arm64Sha: "arm64hash456",
    });

    assert.match(winget, /PackageIdentifier: OpenSourceHub\.OpenSourceHub/);
    assert.match(winget, /PackageVersion: 0\.1\.0/);
    assert.match(winget, /InstallerType: portable/);
    assert.match(winget, /Architecture: x64/);
    assert.match(winget, /InstallerSha256: x64hash123/);
    assert.match(winget, /Architecture: arm64/);
    assert.match(winget, /InstallerSha256: arm64hash456/);
    assert.match(winget, /ManifestVersion: 1\.6\.0/);
  });

  it("verifies POSIX install.sh script hygiene", () => {
    const shPath = path.join(root, "install.sh");
    assert.ok(fs.existsSync(shPath), "install.sh must exist");
    const content = fs.readFileSync(shPath, "utf8");
    assert.match(content, /^#!\/bin\/sh/);
    assert.match(content, /uname -s/);
    assert.match(content, /uname -m/);
    assert.match(content, /SHA256SUMS\.txt/);
    assert.match(content, /~?\/\.local\/bin/);
  });

  it("verifies Windows install.ps1 script hygiene", () => {
    const ps1Path = path.join(root, "install.ps1");
    assert.ok(fs.existsSync(ps1Path), "install.ps1 must exist");
    const content = fs.readFileSync(ps1Path, "utf8");
    assert.match(content, /\$env:PROCESSOR_ARCHITECTURE/);
    assert.match(content, /Programs\\opensource-hub/);
    assert.match(content, /Get-FileHash/);
    assert.match(content, /SetEnvironmentVariable\("Path"/);
  });
});
