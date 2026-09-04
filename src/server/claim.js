import { getUserDataDir } from "./paths.js";
import fs from "node:fs";
import path from "node:path";

function getClaimsFile(dir = getUserDataDir()) {
  return path.join(dir, "claims.json");
}

export function createClaimStore({ dir = getUserDataDir(), gh = null } = {}) {
  const file = getClaimsFile(dir);

  function read() {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      }
    } catch {
      /* first run */
    }
    return { claims: {} };
  }

  function write(data) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch {
      /* silent */
    }
  }

  return {
    generateSnippet(repo, maintainerMeta = {}) {
      const name = maintainerMeta.name || "Project Maintainer";
      const role = maintainerMeta.role || "Core Maintainer";
      const tagline = maintainerMeta.tagline || "Official open-source repository.";
      const recommendedStack = maintainerMeta.recommendedStack || "Official Docker Container";
      const supportUrl = maintainerMeta.supportUrl || `https://github.com/${repo}/discussions`;

      return JSON.stringify(
        {
          $schema: "https://opensource-hub.org/schema/maintainer-v1.json",
          repo,
          verified: true,
          maintainer: {
            name,
            role,
            tagline,
            recommendedStack,
            supportUrl,
          },
          claimedAt: new Date().toISOString(),
          notes: "Official configuration for OpenSource Hub directory verification.",
        },
        null,
        2
      );
    },

    async verify(repo, options = {}) {
      const cleanRepo = String(repo).toLowerCase();
      const data = read();

      // Handle simulated verification (sandbox / evaluation preview)
      if (options.simulate || options.maintainer) {
        const m = options.maintainer || {};
        const claim = {
          repo: cleanRepo,
          verifiedAt: new Date().toISOString(),
          simulated: Boolean(options.simulate),
          maintainer: {
            name: m.name?.trim() || "Verified Maintainer",
            role: m.role?.trim() || "Core Creator",
            tagline: m.tagline?.trim() || "Official maintainer-verified project on OpenSource Hub.",
            recommendedStack: m.recommendedStack?.trim() || "Official Docker / Self-Hosted",
            supportUrl: m.supportUrl?.trim() || `https://github.com/${repo}/discussions`,
            notes: m.notes?.trim() || "Verified via OpenSource Hub Maintainer Portal.",
          },
        };
        data.claims[cleanRepo] = claim;
        write(data);
        return { verified: true, claim };
      }

      // Check if already claimed locally
      if (data.claims[cleanRepo]) {
        return { verified: true, claim: data.claims[cleanRepo] };
      }

      // Check GitHub raw for .opensource-hub.json
      if (gh) {
        try {
          const url = `https://raw.githubusercontent.com/${repo}/HEAD/.opensource-hub.json`;
          const res = await fetch(url);
          if (res.ok) {
            const config = await res.json();
            const claim = {
              repo: cleanRepo,
              verifiedAt: new Date().toISOString(),
              config,
              maintainer: config.maintainer || {
                name: config.claimedBy || "Verified Maintainer",
                role: "Core Maintainer",
                tagline: "Verified via .opensource-hub.json",
                recommendedStack: "Self-Hosted",
                supportUrl: `https://github.com/${repo}`,
              },
            };
            data.claims[cleanRepo] = claim;
            write(data);
            return { verified: true, claim };
          }
        } catch {
          /* verification failed */
        }
      }

      return {
        verified: false,
        message: "No .opensource-hub.json file detected on the default branch yet.",
      };
    },

    getClaim(repo) {
      const data = read();
      return data.claims[String(repo).toLowerCase()] || null;
    },

    isVerified(repo) {
      const data = read();
      return Boolean(data.claims[String(repo).toLowerCase()]);
    },

    unclaim(repo) {
      const cleanRepo = String(repo).toLowerCase();
      const data = read();
      if (data.claims[cleanRepo]) {
        delete data.claims[cleanRepo];
        write(data);
        return true;
      }
      return false;
    },
  };
}
