const BUNDLED_TOOLS = [
  { paid: "Notion", alt: "AFFiNE", savings: "$96/yr", repo: "toeverything/AFFiNE" },
  { paid: "Figma", alt: "Penpot", savings: "$144/yr", repo: "penpot/penpot" },
  { paid: "Slack", alt: "Mattermost / Zulip", savings: "$87/yr", repo: "zulip/zulip" },
  { paid: "Airtable", alt: "NocoDB / Baserow", savings: "$240/yr", repo: "nocodb/nocodb" },
  { paid: "Postman", alt: "Bruno / Hoppscotch", savings: "$168/yr", repo: "usebruno/bruno" },
  { paid: "Datadog", alt: "SigNoz", savings: "$1,800/yr", repo: "SigNoz/signoz" },
  { paid: "1Password", alt: "Bitwarden / KeePassXC", savings: "$36/yr", repo: "bitwarden/clients" },
  { paid: "Zapier", alt: "n8n / Activepieces", savings: "$240/yr", repo: "n8n-io/n8n" },
  { paid: "Sentry", alt: "GlitchTip", savings: "$312/yr", repo: "glitchtip/glitchtip" },
  { paid: "Supabase", alt: "PocketBase", savings: "$300/yr", repo: "pocketbase/pocketbase" },
  { paid: "Firebase", alt: "Supabase", savings: "$300/yr", repo: "supabase/supabase" },
  { paid: "Mailchimp", alt: "Listmonk", savings: "$240/yr", repo: "knadh/listmonk" },
  { paid: "HubSpot", alt: "Twenty CRM", savings: "$600/yr", repo: "twentyhq/twenty" },
  { paid: "Canva", alt: "Polotno / LibreOffice", savings: "$120/yr", repo: "LibreOffice/core" },
  { paid: "Zoom", alt: "Jitsi Meet", savings: "$160/yr", repo: "jitsi/jitsi-meet" },
  { paid: "Jira", alt: "Plane", savings: "$90/yr", repo: "makeplane/plane" },
  { paid: "Linear", alt: "Plane", savings: "$96/yr", repo: "makeplane/plane" },
  { paid: "Miro", alt: "Excalidraw", savings: "$96/yr", repo: "excalidraw/excalidraw" },
  { paid: "Loom", alt: "Cap", savings: "$120/yr", repo: "CapSoftware/Cap" },
  { paid: "Tableau", alt: "Metabase", savings: "$840/yr", repo: "metabase/metabase" }
];

const input = document.getElementById("search");
const resultsContainer = document.getElementById("results");
const statusPill = document.getElementById("engine-status");

let isLocalOnline = false;

// Check connection to local OpenSource Hub instance
fetch("http://localhost:3000/api/health", { cache: "no-store" })
  .then((res) => {
    if (res.ok) {
      isLocalOnline = true;
      statusPill.className = "status-pill status-online";
      statusPill.textContent = "● Local Hub Active";
    } else {
      throw new Error();
    }
  })
  .catch(() => {
    isLocalOnline = false;
    statusPill.className = "status-pill status-offline";
    statusPill.textContent = "● Web Directory Mode";
  });

function getTargetUrl(repo) {
  if (isLocalOnline) {
    return `http://localhost:3000/repo/${repo}`;
  }
  return `https://bengowtham70-dev.github.io/opensource-hub/#repo/${repo}`;
}

function render(items) {
  if (!items || items.length === 0) {
    resultsContainer.innerHTML = `<div style="text-align:center; padding:18px 8px; font-size:12px; color:#71717A;">No matching tools found.<br><span style="font-size:11px; color:#A1A1AA;">Try searching by proprietary name or category.</span></div>`;
    return;
  }
  resultsContainer.innerHTML = items
    .map(
      (t) => `
      <a href="${getTargetUrl(t.repo)}" target="_blank" rel="noopener" class="item">
        <div class="item-title">
          <span>${t.alt}</span>
          <span style="color:#C2410C; font-size:11px; font-weight:600;">Save ~${t.savings}</span>
        </div>
        <div class="item-sub">Replaces ${t.paid} · ${t.repo}</div>
      </a>
    `
    )
    .join("");
}

let debounceTimer = null;

input.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  clearTimeout(debounceTimer);

  if (!q) {
    render(BUNDLED_TOOLS.slice(0, 5));
    return;
  }

  // Instant client filter
  const localFiltered = BUNDLED_TOOLS.filter(
    (t) =>
      t.paid.toLowerCase().includes(q) ||
      t.alt.toLowerCase().includes(q) ||
      t.repo.toLowerCase().includes(q)
  );
  render(localFiltered);

  // If local server online and query > 2 chars, try live search
  if (isLocalOnline && q.length >= 3) {
    debounceTimer = setTimeout(() => {
      fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            const apiItems = data.results.slice(0, 6).map((r) => ({
              paid: r.paidTool?.name || "Proprietary",
              alt: r.name,
              savings: r.estimatedSavings || "$120/yr",
              repo: r.repo,
            }));
            render(apiItems);
          }
        })
        .catch(() => {});
    }, 180);
  }
});

// Initial render
render(BUNDLED_TOOLS.slice(0, 5));
