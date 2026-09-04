/**
 * Supply Chain Defense: Typosquatting & Project Impersonation Detector
 * PRD §29, §20, §618
 *
 * Evaluates repository names against canonical open source leaders and commercial targets
 * to identify typosquats, character transpositions, and deceptive clone repositories.
 */

export const CANONICAL_PROJECTS = [
  { name: "supabase", repo: "supabase/supabase", displayName: "Supabase", minStars: 20000 },
  { name: "vaultwarden", repo: "dani-garcia/vaultwarden", displayName: "Vaultwarden", minStars: 15000 },
  { name: "bitwarden", repo: "bitwarden/server", displayName: "Bitwarden", minStars: 10000 },
  { name: "excalidraw", repo: "excalidraw/excalidraw", displayName: "Excalidraw", minStars: 30000 },
  { name: "penpot", repo: "penpot/penpot", displayName: "Penpot", minStars: 20000 },
  { name: "mattermost", repo: "mattermost/mattermost", displayName: "Mattermost", minStars: 25000 },
  { name: "nextcloud", repo: "nextcloud/server", displayName: "Nextcloud", minStars: 20000 },
  { name: "plausible", repo: "plausible/analytics", displayName: "Plausible Analytics", minStars: 15000 },
  { name: "umami", repo: "umami-software/umami", displayName: "Umami", minStars: 15000 },
  { name: "metabase", repo: "metabase/metabase", displayName: "Metabase", minStars: 30000 },
  { name: "redis", repo: "redis/redis", displayName: "Redis", minStars: 50000 },
  { name: "valkey", repo: "valkey-io/valkey", displayName: "Valkey", minStars: 10000 },
  { name: "grafana", repo: "grafana/grafana", displayName: "Grafana", minStars: 50000 },
  { name: "meilisearch", repo: "meilisearch/meilisearch", displayName: "Meilisearch", minStars: 35000 },
  { name: "minio", repo: "minio/minio", displayName: "MinIO", minStars: 40000 },
  { name: "nocodb", repo: "nocodb/nocodb", displayName: "NocoDB", minStars: 35000 },
  { name: "baserow", repo: "bram2w/baserow", displayName: "Baserow", minStars: 10000 },
  { name: "gitea", repo: "go-gitea/gitea", displayName: "Gitea", minStars: 35000 },
  { name: "forgejo", repo: "forgejo/forgejo", displayName: "Forgejo", minStars: 5000 },
  { name: "affine", repo: "toeverything/affine", displayName: "AFFiNE", minStars: 35000 },
  { name: "appflowy", repo: "appflowy-io/appflowy", displayName: "AppFlowy", minStars: 45000 },
  { name: "immich", repo: "immich-app/immich", displayName: "Immich", minStars: 40000 },
  { name: "jitsi", repo: "jitsi/jitsi-meet", displayName: "Jitsi Meet", minStars: 20000 },
  { name: "bruno", repo: "usebruno/bruno", displayName: "Bruno", minStars: 25000 },
  { name: "rustdesk", repo: "rustdesk/rustdesk", displayName: "RustDesk", minStars: 60000 },
  { name: "cal.com", repo: "calcom/cal.com", displayName: "Cal.com", minStars: 25000 },
  { name: "ghost", repo: "tryghost/ghost", displayName: "Ghost", minStars: 40000 },
  { name: "strapi", repo: "strapi/strapi", displayName: "Strapi", minStars: 55000 },
  { name: "langchain", repo: "langchain-ai/langchain", displayName: "LangChain", minStars: 80000 },
  { name: "smolagents", repo: "huggingface/smolagents", displayName: "smolagents", minStars: 15000 },
  { name: "crewai", repo: "crewAIInc/crewAI", displayName: "CrewAI", minStars: 15000 },
  { name: "autogpt", repo: "Significant-Gravitas/AutoGPT", displayName: "AutoGPT", minStars: 150000 },
  { name: "pocketbase", repo: "pocketbase/pocketbase", displayName: "PocketBase", minStars: 35000 },
  { name: "uptime-kuma", repo: "louislam/uptime-kuma", displayName: "Uptime Kuma", minStars: 45000 },
];

/**
 * Computes Damerau-Levenshtein distance (including adjacent transposition)
 */
export function damerauLevenshtein(a, b) {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[al][bl];
}

/**
 * Checks if a repository name is an impersonation, lookalike, or typosquat of a canonical project.
 *
 * @param {string} fullName - "owner/repo"
 * @param {object} metadata - { stars?: number, isFork?: boolean }
 * @returns {object} Analysis outcome
 */
export function detectTyposquat(fullName, metadata = {}) {
  const safeFull = String(fullName || "").trim();
  const [ownerPart, repoPart] = safeFull.split("/");
  if (!ownerPart || !repoPart) {
    return { isSuspicious: false };
  }

  const owner = ownerPart.toLowerCase();
  const repo = repoPart.toLowerCase();
  const stars = Number(metadata.stars || 0);

  // Strip generic repo suffixes like .git or -app
  const cleanRepo = repo.replace(/\.git$/i, "");

  for (const canon of CANONICAL_PROJECTS) {
    const [canonOwner, canonRepo] = canon.repo.toLowerCase().split("/");
    const canonName = canon.name.toLowerCase();

    // 1. If exact canonical repo, never flag itself!
    if (owner === canonOwner && (cleanRepo === canonRepo || cleanRepo === canonName)) {
      continue;
    }

    // 2. Exact name match but unknown / non-official owner with very low star count
    if (cleanRepo === canonName || cleanRepo === canonRepo) {
      if (owner !== canonOwner) {
        // If stars are drastically lower than canonical threshold, flag as clone/impersonation
        const isLowStars = stars < (canon.minStars * 0.05);
        return {
          isSuspicious: true,
          canonicalTarget: canon.repo,
          canonicalName: canon.displayName,
          reason: `Exact project name "${canon.displayName}" under unverified owner "${owner}" with low stars (${stars}). Possible fake clone.`,
          confidence: isLowStars ? 0.95 : 0.75,
          severity: "critical",
        };
      }
    }

    // 3. Deceptive prefix or suffix on non-official owner (e.g. "official-penpot", "penpot-official", "free-notion")
    const prefixRegex = /^(official|real|free|verified|download|the)[-_.]+(.+)$/i;
    const suffixRegex = /^(.+)[-_.]+(official|real|free|verified|release|crack|clone)$/i;

    const prefixMatch = cleanRepo.match(prefixRegex);
    const suffixMatch = cleanRepo.match(suffixRegex);
    const coreName = (prefixMatch ? prefixMatch[2] : (suffixMatch ? suffixMatch[1] : null));

    if (coreName && (coreName === canonName || coreName === canonRepo)) {
      if (owner !== canonOwner) {
        return {
          isSuspicious: true,
          canonicalTarget: canon.repo,
          canonicalName: canon.displayName,
          reason: `Suspicious lookalike repository with deceptive prefix/suffix targeting official ${canon.displayName}.`,
          confidence: 0.9,
          severity: "critical",
        };
      }
    }

    // 4. Edit distance (Levenshtein / Transposition)
    // Only compare if strings are similar in length
    if (Math.abs(cleanRepo.length - canonName.length) <= 2 && cleanRepo.length >= 4) {
      const dist = damerauLevenshtein(cleanRepo, canonName);

      if (dist === 1 || (dist === 2 && cleanRepo.length >= 7)) {
        // Exclude coincidental short names
        return {
          isSuspicious: true,
          canonicalTarget: canon.repo,
          canonicalName: canon.displayName,
          reason: `Suspicious typo-squatting or lookalike name detected. "${repoPart}" is only ${dist} character(s) away from official ${canon.displayName}.`,
          confidence: dist === 1 ? 0.92 : 0.82,
          severity: dist === 1 ? "critical" : "warning",
        };
      }
    }
  }

  return { isSuspicious: false };
}
