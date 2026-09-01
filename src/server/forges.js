// Universal Forge Client for GitLab (gitlab.com) and Codeberg (codeberg.org)

export function createForgeClient() {
  return {
    async getGitLabRepo(owner, name) {
      try {
        const pathEncoded = encodeURIComponent(`${owner}/${name}`);
        const res = await fetch(`https://gitlab.com/api/v4/projects/${pathEncoded}`);
        if (!res.ok) return { data: null, error: `GitLab error: ${res.status}` };
        const p = await res.json();
        return {
          data: {
            forge: "gitlab",
            fullName: `${owner}/${name}`,
            name: p.name,
            description: p.description || "",
            stars: p.star_count || 0,
            forks: p.forks_count || 0,
            openIssues: p.open_issues_count || 0,
            defaultBranch: p.default_branch || "main",
            lastPushedAt: p.last_activity_at,
            createdAt: p.created_at,
            license: { spdx: "Open Source", type: "permissive" },
            webUrl: p.web_url,
            avatarUrl: p.avatar_url,
          },
        };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },

    async getCodebergRepo(owner, name) {
      try {
        const res = await fetch(`https://codeberg.org/api/v1/repos/${owner}/${name}`);
        if (!res.ok) return { data: null, error: `Codeberg error: ${res.status}` };
        const p = await res.json();
        return {
          data: {
            forge: "codeberg",
            fullName: `${owner}/${name}`,
            name: p.name,
            description: p.description || "",
            stars: p.stars_count || 0,
            forks: p.forks_count || 0,
            openIssues: p.open_issues_count || 0,
            defaultBranch: p.default_branch || "main",
            lastPushedAt: p.updated_at,
            createdAt: p.created_at,
            license: { spdx: "Open Source", type: "permissive" },
            webUrl: p.html_url,
            avatarUrl: p.owner?.avatar_url,
          },
        };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
  };
}
