const TOOLS = [
  { paid: "Notion", alt: "AFFiNE", savings: "$96/yr", repo: "toeverything/AFFiNE" },
  { paid: "Figma", alt: "Penpot", savings: "$144/yr", repo: "penpot/penpot" },
  { paid: "Slack", alt: "Zulip / Mattermost", savings: "$87/yr", repo: "zulip/zulip" },
  { paid: "Airtable", alt: "NocoDB", savings: "$240/yr", repo: "nocodb/nocodb" },
  { paid: "Postman", alt: "Bruno", savings: "$168/yr", repo: "usebruno/bruno" },
  { paid: "Datadog", alt: "SigNoz", savings: "$1,800/yr", repo: "SigNoz/signoz" },
  { paid: "1Password", alt: "Bitwarden", savings: "$36/yr", repo: "bitwarden/clients" },
  { paid: "Zapier", alt: "n8n", savings: "$240/yr", repo: "n8n-io/n8n" },
  { paid: "Sentry", alt: "GlitchTip", savings: "$312/yr", repo: "glitchtip/glitchtip" },
  { paid: "Supabase", alt: "PocketBase", savings: "$300/yr", repo: "pocketbase/pocketbase" }
];

const input = document.getElementById("search");
const resultsContainer = document.getElementById("results");

function render(items) {
  if (items.length === 0) {
    resultsContainer.innerHTML = `<div style="text-align:center; padding:12px; font-size:12px; color:#71717A;">No matching tools found.</div>`;
    return;
  }
  resultsContainer.innerHTML = items
    .map(
      (t) => `
      <a href="http://localhost:3000/repo/${t.repo}" target="_blank" class="item">
        <div class="item-title">
          <span>${t.alt}</span>
          <span style="color:#C2410C; font-size:11.5px;">Save ~${t.savings}</span>
        </div>
        <div class="item-sub">Replaces ${t.paid} · ${t.repo}</div>
      </a>
    `
    )
    .join("");
}

input.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    render(TOOLS.slice(0, 5));
    return;
  }
  const filtered = TOOLS.filter(
    (t) =>
      t.paid.toLowerCase().includes(q) ||
      t.alt.toLowerCase().includes(q) ||
      t.repo.toLowerCase().includes(q)
  );
  render(filtered);
});

// Initial render top 5
render(TOOLS.slice(0, 5));
