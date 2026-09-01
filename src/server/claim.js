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
    generateSnippet(repo, maintainerName = "") {
      return JSON.stringify(
        {
          $schema: "https://opensource-hub.org/schema/maintainer-v1.json",
          repo,
          verified: true,
          claimedBy: maintainerName || "maintainer",
          claimedAt: new Date().toISOString(),
          notes: "Official configuration for OpenSource Hub directory verification.",
        },
        null,
        2
      );
    },

    async verify(repo) {
      const cleanRepo = String(repo).toLowerCase();
      // Check if already claimed locally
      const data = read();
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

    isVerified(repo) {
      const data = read();
      return Boolean(data.claims[String(repo).toLowerCase()]);
    },
  };
}
