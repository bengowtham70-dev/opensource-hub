// OpenSource Hub — Content Script (PRD §441 / Manifest V3)
// Alerts users to verified open-source alternatives on proprietary SaaS domains.

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
    "atlassian.net": { name: "Jira / Confluence", alt: "Plane / BookStack", savings: "$180/yr", repo: "makeplane/plane" },
    "asana.com": { name: "Asana", alt: "Plane / Focalboard", savings: "$132/yr", repo: "makeplane/plane" },
    "clickup.com": { name: "ClickUp", alt: "Plane / AppFlowy", savings: "$84/yr", repo: "makeplane/plane" },
    "linear.app": { name: "Linear", alt: "Plane", savings: "$96/yr", repo: "makeplane/plane" },
    "1password.com": { name: "1Password", alt: "Bitwarden / KeePassXC", savings: "$36/yr", repo: "bitwarden/clients" },
    "lastpass.com": { name: "LastPass", alt: "Bitwarden / Vaultwarden", savings: "$36/yr", repo: "dani-garcia/vaultwarden" },
    "bitwarden.com": { name: "Bitwarden Cloud", alt: "Vaultwarden (Self-Hosted)", savings: "$40/yr", repo: "dani-garcia/vaultwarden" },
    "zapier.com": { name: "Zapier", alt: "n8n / Activepieces", savings: "$240/yr", repo: "n8n-io/n8n" },
    "make.com": { name: "Make", alt: "n8n / Activepieces", savings: "$108/yr", repo: "n8n-io/n8n" },
    "segment.com": { name: "Segment", alt: "RudderStack / Jitsu", savings: "$1,440/yr", repo: "jitsucom/jitsu" },
    "mixpanel.com": { name: "Mixpanel", alt: "PostHog", savings: "$300/yr", repo: "PostHog/posthog" },
    "amplitude.com": { name: "Amplitude", alt: "PostHog", savings: "$600/yr", repo: "PostHog/posthog" },
    "loom.com": { name: "Loom", alt: "Cap / Screenity", savings: "$120/yr", repo: "CapSoftware/Cap" },
    "miro.com": { name: "Miro", alt: "Excalidraw", savings: "$96/yr", repo: "excalidraw/excalidraw" },
    "monday.com": { name: "Monday.com", alt: "Plane / Taiga", savings: "$120/yr", repo: "makeplane/plane" },
    "zendesk.com": { name: "Zendesk", alt: "Chatwoot / FreeScout", savings: "$660/yr", repo: "chatwoot/chatwoot" },
    "intercom.com": { name: "Intercom", alt: "Chatwoot", savings: "$900/yr", repo: "chatwoot/chatwoot" },
    "pagerduty.com": { name: "PagerDuty", alt: "Keep / OnCall", savings: "$252/yr", repo: "keephq/keep" },
    "shopify.com": { name: "Shopify", alt: "Medusa / Saleor", savings: "$468/yr", repo: "medusajs/medusa" },
    "mailgun.com": { name: "Mailgun", alt: "Postal", savings: "$420/yr", repo: "postalserver/postal" },
    "tableau.com": { name: "Tableau", alt: "Metabase / Apache Superset", savings: "$840/yr", repo: "metabase/metabase" },
    "salesforce.com": { name: "Salesforce", alt: "Twenty / SuiteCRM", savings: "$1,200/yr", repo: "twentyhq/twenty" }
  };

  const hostname = window.location.hostname.toLowerCase();
  let matchedDomain = null;
  let match = null;

  for (const [domain, info] of Object.entries(PAIRINGS_MAP)) {
    if (hostname === domain || hostname.endsWith("." + domain)) {
      matchedDomain = domain;
      match = info;
      break;
    }
  }

  if (!match) return;

  // Check if dismissed previously
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["osh_dismissed"], (res) => {
      const dismissed = res.osh_dismissed || [];
      if (dismissed.includes(matchedDomain)) return;
      initBanner(match, matchedDomain);
    });
  } else {
    initBanner(match, matchedDomain);
  }

  function initBanner(item, domainKey) {
    if (document.getElementById("osh-floating-banner")) return;

    // Detect if local OpenSource Hub dashboard is running
    const localUrl = `http://localhost:3000/repo/${item.repo}`;
    const publicUrl = `https://bengowtham70-dev.github.io/opensource-hub/#repo/${item.repo}`;
    const fallbackGithubUrl = `https://github.com/${item.repo}`;

    const container = document.createElement("div");
    container.id = "osh-floating-banner";
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: #18181B;
      color: #F4F4F5;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
      padding: 14px 18px;
      border-radius: 12px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      line-height: 1.4;
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      animation: osh-slide-up 0.25s ease-out;
    `;

    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes osh-slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #osh-floating-banner .osh-btn-primary:hover {
        background: #EA580C !important;
      }
      #osh-floating-banner .osh-btn-close:hover {
        color: #FFFFFF !important;
        background: rgba(255,255,255,0.12) !important;
      }
    `;
    document.head.appendChild(styleEl);

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:28px; height:28px; border-radius:6px; background:#27272A; display:flex; align-items:center; justify-content:center; font-size:14px;">
          ◆
        </div>
        <div>
          <div style="font-weight:600; color:#FFFFFF; display:flex; align-items:center; gap:6px;">
            Free Alternative: <span style="color:#FB923C;">${item.alt}</span>
          </div>
          <div style="color:#A1A1AA; font-size:11.5px;">
            Replaces ${item.name} · Estimated savings <strong style="color:#34D399;">~${item.savings}</strong>
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:6px; margin-left:8px;">
        <a id="osh-target-link" href="${localUrl}" target="_blank" rel="noopener" class="osh-btn-primary" style="
          background: #C2410C;
          color: #FFFFFF;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          transition: background 150ms;
        ">Explore Alternative ↗</a>
        <button id="osh-dismiss-btn" class="osh-btn-close" title="Dismiss" style="
          background: transparent;
          border: none;
          color: #71717A;
          cursor: pointer;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
          transition: all 150ms;
        ">✕</button>
      </div>
    `;

    document.body.appendChild(container);

    // Verify if localhost:3000 is running, otherwise fallback to public directory
    const linkEl = container.querySelector("#osh-target-link");
    fetch("http://localhost:3000/api/health", { mode: "no-cors", cache: "no-store" })
      .then(() => {
        // Local server is running
        linkEl.href = localUrl;
      })
      .catch(() => {
        // Local server offline: route to public website or github
        linkEl.href = publicUrl;
      });

    // Handle dismiss
    const dismissBtn = container.querySelector("#osh-dismiss-btn");
    dismissBtn.addEventListener("click", () => {
      container.style.opacity = "0";
      container.style.transform = "translateY(10px)";
      setTimeout(() => container.remove(), 150);

      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["osh_dismissed"], (res) => {
          const dismissed = res.osh_dismissed || [];
          if (!dismissed.includes(domainKey)) {
            dismissed.push(domainKey);
            chrome.storage.local.set({ osh_dismissed: dismissed });
          }
        });
      }
    });
  }
})();
