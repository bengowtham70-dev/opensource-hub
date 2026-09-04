// plans/PLAN_PHASE2.md Phase 9 & PRD §30 — Multi-channel packaging generators.
// Emits:
//   - packaging/homebrew/opensource-hub.rb (Homebrew Formula)
//   - packaging/scoop/opensource-hub.json (Scoop Manifest)
//   - packaging/winget/opensource-hub.yaml (Winget Manifest)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "packaging");

export function sha256(bufOrStream) {
  return crypto.createHash("sha256").update(bufOrStream).digest("hex");
}

export function generateHomebrewFormula({ repoSlug, version, tarballSha }) {
  const registry = "https://registry.npmjs.org";
  const tgzUrl = `${registry}/opensource-hub/-/opensource-hub-${version}.tgz`;
  return `class OpensourceHub < Formula
  desc "Find free open-source alternatives to the paid software you use"
  homepage "https://github.com/${repoSlug}"
  url "${tgzUrl}"
  sha256 "${tarballSha || "PLACEHOLDER_RUN_AFTER_NPM_PUBLISH"}"
  license "MIT"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.install libexec/"bin/cli.js" => "opensource-hub"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/opensource-hub --version")
  end
end
`;
}

export function generateScoopManifest({ repoSlug, version, exeSha }) {
  const exeAsset = `opensource-hub-v${version}-windows-x64.exe`;
  const dlBase = `https://github.com/${repoSlug}/releases/download/v${version}`;
  return {
    version,
    description: "Find free open-source alternatives to paid software. Local dashboard, zero accounts.",
    homepage: `https://github.com/${repoSlug}`,
    license: "MIT",
    architecture: {
      "64bit": {
        url: `${dlBase}/${exeAsset}#/opensource-hub.exe`,
        hash: exeSha || "PLACEHOLDER_RUN_AFTER_RELEASE_BUILD",
      },
    },
    bin: "opensource-hub.exe",
    checkver: { github: `https://github.com/${repoSlug}` },
    autoupdate: {
      architecture: {
        "64bit": {
          url: `${dlBase.replace(`v${version}`, "v$version")}/opensource-hub-v$version-windows-x64.exe#/opensource-hub.exe`,
          hash: {
            url: `${dlBase.replace(`v${version}`, "v$version")}/SHA256SUMS.txt`,
            find: "([a-f0-9]{64})\\s+\\*?opensource-hub-v\\$version-windows-x64\\.exe",
          },
        },
      },
    },
  };
}

export function generateWingetManifest({ repoSlug, version, x64Sha, arm64Sha }) {
  const dlBase = `https://github.com/${repoSlug}/releases/download/v${version}`;
  const x64Asset = `opensource-hub-v${version}-windows-x64.exe`;
  const arm64Asset = `opensource-hub-v${version}-windows-arm64.exe`;

  return `# yaml-language-server: $schema=https://aka.ms/winget-manifest.version.1.6.0.schema.json
PackageIdentifier: OpenSourceHub.OpenSourceHub
PackageVersion: ${version}
DefaultLocale: en-US
Publisher: OpenSource Hub
PublisherUrl: https://github.com/${repoSlug}
PackageName: OpenSource Hub
PackageUrl: https://github.com/${repoSlug}
License: MIT
ShortDescription: Find free open-source alternatives to paid software. Local dashboard, zero accounts.
Description: One command installs a local dashboard of free, open-source alternatives to the paid tools you already use — with trust signals on every repo.
Moniker: opensource-hub
Tags:
  - open-source
  - alternatives
  - self-hosted
  - developer-tools
ReleaseDate: ${new Date().toISOString().slice(0, 10)}
Installers:
  - Architecture: x64
    InstallerType: portable
    InstallerUrl: ${dlBase}/${x64Asset}
    InstallerSha256: ${x64Sha || "PLACEHOLDER_RUN_AFTER_RELEASE_BUILD"}
    Commands:
      - opensource-hub
  - Architecture: arm64
    InstallerType: portable
    InstallerUrl: ${dlBase}/${arm64Asset}
    InstallerSha256: ${arm64Sha || "PLACEHOLDER_RUN_AFTER_RELEASE_BUILD"}
    Commands:
      - opensource-hub
ManifestType: singleton
ManifestVersion: 1.6.0
`;
}

// CLI execution if run directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const REPO_SLUG = process.env.OH_REPO_SLUG || "bengowtham70/opensource-hub";
  const rawVersion = process.argv[2]?.replace(/^v/, "");
  if (!rawVersion || !/^\d+\.\d+\.\d+(-[\w.+]+)?$/.test(rawVersion)) {
    console.error("usage: node scripts/build-packaging.mjs <version>");
    process.exit(1);
  }
  const version = rawVersion;
  const SKIP_FORMULA = Boolean(process.env.OH_SKIP_FORMULA);

  // Homebrew tarball SHA
  const registry = "https://registry.npmjs.org";
  const tgzUrl = `${registry}/opensource-hub/-/opensource-hub-${version}.tgz`;
  let tarballSha = "";
  if (!SKIP_FORMULA) {
    try {
      const tgzRes = await fetch(tgzUrl);
      if (tgzRes.ok) {
        tarballSha = sha256(Buffer.from(await tgzRes.arrayBuffer()));
      } else {
        console.warn(`notice: npm tarball fetch returned ${tgzRes.status}; using placeholder for formula.`);
        tarballSha = "PLACEHOLDER_TARBALL_SHA";
      }
    } catch {
      console.warn("notice: npm registry unreachable; using placeholder for formula.");
      tarballSha = "PLACEHOLDER_TARBALL_SHA";
    }
  }

  // Windows SHA sums
  let x64Sha = "";
  let arm64Sha = "";
  const sumsPath = path.join(OUT, "SHA256SUMS.txt");
  if (fs.existsSync(sumsPath)) {
    const lines = fs.readFileSync(sumsPath, "utf8").split("\n");
    for (const l of lines) {
      if (l.includes(`windows-x64.exe`)) x64Sha = l.split(/\s+/)[0];
      if (l.includes(`windows-arm64.exe`)) arm64Sha = l.split(/\s+/)[0];
    }
  }

  const formula = generateHomebrewFormula({ repoSlug: REPO_SLUG, version, tarballSha });
  const scoop = generateScoopManifest({ repoSlug: REPO_SLUG, version, exeSha: x64Sha });
  const winget = generateWingetManifest({ repoSlug: REPO_SLUG, version, x64Sha, arm64Sha });

  fs.mkdirSync(path.join(OUT, "homebrew"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "scoop"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "winget"), { recursive: true });

  if (!SKIP_FORMULA) {
    fs.writeFileSync(path.join(OUT, "homebrew", "opensource-hub.rb"), formula);
  }
  fs.writeFileSync(path.join(OUT, "scoop", "opensource-hub.json"), `${JSON.stringify(scoop, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT, "winget", "opensource-hub.yaml"), winget);

  console.log(
    `packaging written for v${version}` +
      (SKIP_FORMULA ? " (formula skipped)" : ` (tarball sha ${tarballSha.slice(0, 12)}…)`) +
      (x64Sha ? ", exe sha present" : ", exe sha pending")
  );
}
