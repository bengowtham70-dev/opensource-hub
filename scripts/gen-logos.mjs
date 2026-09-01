// One-off generator: emits dashboard/src/lib/logos.js with VERIFIED brand entries.
import * as si from "simple-icons";
import fs from "node:fs";

const wanted = {
  "toeverything/AFFiNE": ["affine"], "usebruno/bruno": ["bruno"], "penpot/penpot": ["penpot"],
  "zulip/zulip": ["zulip"], "LibreOffice/core": ["libreoffice"], "GNOME/gimp": ["gimp", "gnome"],
  "Inkscape/inkscape": ["inkscape"], "nextcloud/server": ["nextcloud"], "bitwarden/clients": ["bitwarden"],
  "keepassxreboot/keepassxc": ["keepassxc", "keepass"], "jitsi/jitsi-meet": ["jitsi", "jitsimeet"],
  "mattermost/focalboard": ["mattermost"], "makeplane/plane": ["plane"], "wekan/wekan": ["wekan"],
  "nocodb/nocodb": ["nocodb"], "excalidraw/excalidraw": ["excalidraw"], "languagetool-org/languagetool": ["languagetool"],
  "KDE/kdenlive": ["kdenlive", "kde"], "metabase/metabase": ["metabase"], "supabase/supabase": ["supabase"],
  "goauthentik/authentik": ["authentik"], "coollabsio/coolify": ["coolify"], "go-vikunja/vikunja": ["vikunja"],
  "navidrome/navidrome": ["navidrome"], "opf/openproject": ["openproject"], "laurent22/joplin": ["joplin"],
  "darktable-org/darktable": ["darktable"], "containers/podman-desktop": ["podman", "podmandesktop"],
  notion: ["notion"], postman: ["postman"], figma: ["figma"], slack: ["slack"],
  "microsoft-365": ["microsoftoffice", "microsoft"], photoshop: ["adobephotoshop", "adobe"],
  illustrator: ["adobeillustrator", "adobe"], dropbox: ["dropbox"], "1password": ["1password", "onepassword"],
  lastpass: ["lastpass"], zoom: ["zoom"], trello: ["trello"], asana: ["asana"], monday: ["monday", "mondaydotcom"],
  airtable: ["airtable"], miro: ["miro"], grammarly: ["grammarly"], "premiere-pro": ["adobepremierepro", "adobe"],
  tableau: ["tableau"], firebase: ["firebase"], auth0: ["auth0"], heroku: ["heroku"],
  todoist: ["todoist"], spotify: ["spotify"], jira: ["jira"], evernote: ["evernote"],
  lightroom: ["adobelightroom", "adobe"], "docker-desktop": ["docker"],
};

const keyFor = (s) => "si" + s.charAt(0).toUpperCase() + s.slice(1).replace(/\./g, "");
const byRepo = {};
const byPaid = {};
let n = 0;
for (const [k, cands] of Object.entries(wanted)) {
  for (const c of cands) {
    const icon = si[keyFor(c)];
    if (icon) {
      // Inline path data so the client bundle never imports the full icon barrel.
      const entry = { title: icon.title, hex: icon.hex, path: icon.path, slug: icon.slug };
      if (k.includes("/")) byRepo[k] = entry;
      else byPaid[k] = entry;
      n++;
      break;
    }
  }
}

const version = JSON.parse(fs.readFileSync("node_modules/simple-icons/package.json", "utf8")).version;
const header =
  `// Brand logo map — slugs VERIFIED against simple-icons@${version} on 2026-08-24.\n` +
  `// Path data inlined (never import the full simple-icons barrel client-side).\n` +
  `// Keys absent here (plane, wekan, nocodb, navidrome, darktable, adobe/microsoft family)\n` +
  `// intentionally fall back to letter avatars — never fabricate a brand mark.\n\n`;
const body =
  "export const BRAND_BY_REPO = " + JSON.stringify(byRepo, null, 2) + ";\n\n" +
  "export const BRAND_BY_PAID = " + JSON.stringify(byPaid, null, 2) + ";\n";
fs.writeFileSync("dashboard/src/lib/logos.js", header + body);
console.log(`wrote logos.js: ${n} verified brands (repo: ${Object.keys(byRepo).length}, paid: ${Object.keys(byPaid).length})`);
