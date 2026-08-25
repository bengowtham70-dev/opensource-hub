// plans/PLAN_PHASE2.md Phase 9 — Homebrew Formula + Scoop manifest generators.
// Emits packaging/homebrew/opensource-hub.rb and packaging/scoop/opensource-hub.json
// for a given version (+ hashes). The tap/bucket repos themselves are external
// (cross-repo PAT pushes happen in release.yml; PRD section 30).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "packaging");

const REPO_SLUG = process.env.OH_REPO_SLUG || "opensource-hub/opensource-hub";
const version = process.argv[2]?.replace(/^v/, "");
if (!version || !/^\d+\.\d+\.\d+(-[\w.+]+)?$/.test(version)) {
  console.error("usage: node scripts/build-packaging.mjs <version>");
  process.exit(1);
}
const SKIP_FORMULA = Boolean(process.env.OH_SKIP_FORMULA);

function sha256(bufOrStream) {
  return crypto.createHash("sha256").update(bufOrStream).digest("hex");
}

// --- Homebrew: installs from the npm registry tarball (the canonical artifact).
// OH_SKIP_FORMULA=1 lets the release pipeline build scoop artifacts even when
// npm publishing was skipped (no NPM_TOKEN) — the tap job handles formula later.
const registry = "https://registry.npmjs.org";
const tgzUrl = `${registry}/opensource-hub/-/opensource-hub-${version}.tgz`;
let tarballSha = "";
if (!SKIP_FORMULA) {
  const tgzRes = await fetch(tgzUrl);
  if (!tgzRes.ok) {
    console.error(`npm tarball fetch failed: ${tgzRes.status} (${tgzUrl})`);
    process.exit(1);
  }
  tarballSha = sha256(Buffer.from(await tgzRes.arrayBuffer()));
}

const formula = `class OpensourceHub < Formula
  desc "Find free open-source alternatives to the paid software you use"
  homepage "https://github.com/${REPO_SLUG}"
  url "${tgzUrl}"
  sha256 "${tarballSha}"
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

// --- Scoop: single Windows x64 binary from GitHub releases, autoupdate block
// keyed off releases so bucket bots stay current without our involvement.
const exeAsset = `opensource-hub-v${version}-windows-x64.exe`;
const dlBase = `https://github.com/${REPO_SLUG}/releases/download/v${version}`;
let exeSha = "";
const sumsPath = path.join(OUT, "SHA256SUMS.txt");
if (fs.existsSync(sumsPath)) {
  const line = fs
    .readFileSync(sumsPath, "utf8")
    .split("\n")
    .find((l) => l.trim().endsWith(exeAsset));
  if (line) exeSha = line.split(/\s+/)[0];
}

const scoop = {
  version,
  description: "Find free open-source alternatives to paid software. Local dashboard, zero accounts.",
  homepage: `https://github.com/${REPO_SLUG}`,
  license: "MIT",
  architecture: {
    "64bit": {
      url: `${dlBase}/${exeAsset}#/opensource-hub.exe`,
      hash: exeSha || "PLACEHOLDER_RUN_AFTER_RELEASE_BUILD",
    },
  },
  bin: "opensource-hub.exe",
  checkver: { github: `https://github.com/${REPO_SLUG}` },
  autoupdate: {
    architecture: {
      "64bit": {
        url: `${dlBase.replace(`v${version}`, "v$version")}/opensource-hub-v$version-windows-x64.exe#/opensource-hub.exe`,
        // Bucket bots must never bump versions without a real hash: scoop's
        // autoupdate extracts it from the SHA256SUMS.txt shipped per release.
        hash: {
          url: `${dlBase.replace(`v${version}`, "v$version")}/SHA256SUMS.txt`,
          find: "([a-f0-9]{64})\\s+\\*?opensource-hub-v\\$version-windows-x64\\.exe",
        },
      },
    },
  },
};

fs.mkdirSync(path.join(OUT, "homebrew"), { recursive: true });
fs.mkdirSync(path.join(OUT, "scoop"), { recursive: true });
if (!SKIP_FORMULA) {
  fs.writeFileSync(path.join(OUT, "homebrew", "opensource-hub.rb"), formula);
}
fs.writeFileSync(
  path.join(OUT, "scoop", "opensource-hub.json"),
  `${JSON.stringify(scoop, null, 2)}\n`
);
console.log(
  `packaging written for v${version}` +
    (SKIP_FORMULA ? " (formula skipped)" : ` (tarball sha ${tarballSha.slice(0, 12)}…)`) +
    (exeSha ? ", exe sha present" : ", exe sha pending")
);
