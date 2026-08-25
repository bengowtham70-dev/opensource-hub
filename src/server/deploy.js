// PRD §3 — self-host difficulty + one-click deploy derivation (F4).
// Pure logic shared by the dashboard component and tests.
// Render is deliberately OMITTED: its deploy button requires render.yaml at the
// repo ROOT, so a generic button fails on most repos (verified 2026) — shipping
// broken buttons violates PRD §2.6a honesty.
export function deriveSelfHost({ platforms = [], ecosystems = {} } = {}) {
  if (platforms.includes("web") && !platforms.includes("self-host")) {
    return { label: "Hosted app", tone: "border-primary/30 bg-primary/10 text-primary", note: "Runs in the browser — nothing to host." };
  }
  if (ecosystems.docker) {
    return { label: "Needs Docker", tone: "border-tech/30 bg-tech/10 text-tech", note: "Ships a Docker image — one compose file away from running." };
  }
  if (platforms.includes("self-host")) {
    return { label: "Needs a sysadmin", tone: "border-caution/30 bg-caution/10 text-caution", note: "Self-hosting without packaged Docker — expect manual setup." };
  }
  return null;
}

export function deployTargets({ platforms = [], ecosystems = {} } = {}) {
  const targets = [];
  if (ecosystems.docker) {
    targets.push({
      name: "Railway",
      url: (repo) =>
        `https://railway.com/new/template?template=${encodeURIComponent(`https://github.com/${repo}`)}&utm_medium=integration&utm_source=opensource-hub&utm_campaign=deploy`,
    });
  }
  if (platforms.includes("web")) {
    targets.push({
      name: "Vercel",
      url: (repo) => `https://vercel.com/new/clone?repository-url=${encodeURIComponent(`https://github.com/${repo}`)}`,
    });
  }
  return targets;
}
