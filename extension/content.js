// OpenSource Hub — Content Script
// Matches proprietary SaaS domains and displays available open-source alternatives.

(function () {
  const PAIRINGS_MAP = {
    "notion.so": { name: "Notion", alt: "AFFiNE / AppFlowy", savings: "$96/yr", repo: "toeverything/AFFiNE" },
    "figma.com": { name: "Figma", alt: "Penpot", savings: "$144/yr", repo: "penpot/penpot" },
    "slack.com": { name: "Slack", alt: "Mattermost / Zulip", savings: "$87/yr", repo: "zulip/zulip" },
    "airtable.com": { name: "Airtable", alt: "NocoDB / Baserow", savings: "$240/yr", repo: "nocodb/nocodb" },
    "trello.com": { name: "Trello", alt: "Planka / Wekan", savings: "$60/yr", repo: "plankanban/planka" },
    "postman.com": { name: "Postman", alt: "Hoppscotch / Bruno", savings: "$168/yr", repo: "usebruno/bruno" },
    "datadoghq.com": { name: "Datadog", alt: "SigNoz", savings: "$1,800/yr", repo: "SigNoz/signoz" },
    "sentry.io": { name: "Sentry", alt: "GlitchTip", savings: "$312/yr", repo: "glitchtip/glitchtip" },
    "supabase.com": { name: "Supabase", alt: "Appwrite / PocketBase", savings: "$300/yr", repo: "pocketbase/pocketbase" },
    "firebase.google.com": { name: "Firebase", alt: "Supabase / PocketBase", savings: "$300/yr", repo: "supabase/supabase" },
    "mailchimp.com": { name: "Mailchimp", alt: "Listmonk", savings: "$240/yr", repo: "knadh/listmonk" },
    "hubspot.com": { name: "HubSpot", alt: "Twenty / SuiteCRM", savings: "$600/yr", repo: "twentyhq/twenty" },
    "canva.com": { name: "Canva", alt: "Polotno / LibreOffice", savings: "$120/yr", repo: "LibreOffice/core" },
    "zoom.us": { name: "Zoom", alt: "Jitsi Meet", savings: "$160/yr", repo: "jitsi/jitsi-meet" },
    "jira.atlassian.com": { name: "Jira", alt: "Plane / Leantime", savings: "$90/yr", repo: "makeplane/plane" },
    "asana.com": { name: "Asana", alt: "Plane / Focalboard", savings: "$132/yr", repo: "makeplane/plane" },
    "clickup.com": { name: "ClickUp", alt: "Plane / AppFlowy", savings: "$84/yr", repo: "makeplane/plane" },
    "linear.app": { name: "Linear", alt: "Plane", savings: "$96/yr", repo: "makeplane/plane" },
    "1password.com": { name: "1Password", alt: "Bitwarden / KeePassXC", savings: "$36/yr", repo: "bitwarden/clients" },
    "zapier.com": { name: "Zapier", alt: "n8n / Activepieces", savings: "$240/yr", repo: "n8n-io/n8n" },
    "make.com": { name: "Make", alt: "n8n / Activepieces", savings: "$108/yr", repo: "n8n-io/n8n" },
    "segment.com": { name: "Segment", alt: "RudderStack / Jitsu", savings: "$1,440/yr", repo: "jitsucom/jitsu" },
    "mixpanel.com": { name: "Mixpanel", alt: "PostHog", savings: "$300/yr", repo: "PostHog/posthog" },
    "amplitude.com": { name: "Amplitude", alt: "PostHog", savings: "$600/yr", repo: "PostHog/posthog" }
  };

  const hostname = window.location.hostname.toLowerCase();
  let match = null;

  for (const [domain, info] of Object.entries(PAIRINGS_MAP)) {
    if (hostname === domain || hostname.endsWith("." + domain)) {
      match = info;
      break;
    }
  }

  if (!match) return;

  // Don't re-inject if already present
  if (document.getElementById("osh-floating-banner")) return;

  const container = document.createElement("div");
  container.id = "osh-floating-banner";
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999999;
    background: #18181B;
    color: #F4F4F5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 14px 18px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    line-height: 1.4;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    animation: osh-slide-up 0.4s ease-out;
  `;

  // Add keyframe animation style
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes osh-slide-up {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    #osh-floating-banner a:hover {
      background: #EA580C !important;
    }
  `;
  document.head.appendChild(styleEl);

  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:16px;">💡</span>
      <div>
        <div style="font-weight:600; color:#FFFFFF;">Free Alternative: <span style="color:#FB923C;">${match.alt}</span></div>
        <div style="color:#A1A1AA; font-size:11.5px;">Replaces ${match.name} · Save ~${match.savings}</div>
      </div>
    </div>
    <a href="http://localhost:3000/repo/${match.repo}" target="_blank" style="
      background: #C2410C;
      color: #FFFFFF;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      margin-left: 4px;
      transition: background 0.15s;
    ">View App</a>
    <button id="osh-close-btn" style="
      background: transparent;
      border: none;
      color: #71717A;
      cursor: pointer;
      font-size: 16px;
      padding: 2px 4px;
      line-height: 1;
      margin-left: 2px;
    ">×</button>
  `;

  document.body.appendChild(container);

  document.getElementById("osh-close-btn").addEventListener("click", () => {
    container.style.opacity = "0";
    container.style.transform = "translateY(20px)";
    setTimeout(() => container.remove(), 300);
  });
})();
