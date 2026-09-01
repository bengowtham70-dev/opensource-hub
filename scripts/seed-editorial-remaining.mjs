// Hand-written editorial for remaining 25 pairings — parity P6.
// Rules: concrete, honest gaps, specific migration steps. No marketing tells.
import fs from "node:fs";

const EDITORIAL = {
  "postman": [
    "Bruno stores every collection as plain-text files — requests, variables and scripts sit in a folder you can version with git. There is no sync account, no cloud workspace, nothing phoning home. Endpoints, environments and assertions all work from that folder, and scripting uses plain JavaScript.",
    "The honest gaps: there is no hosted team workspace by design, so real-time co-editing of a shared collection happens through git, not a web UI. Mock servers and some of Postman's heavier CI integrations need a separate tool.",
    "Migration is direct: export Postman collections as v2.1 JSON, then File → Open Collection in Bruno. Environment files map to Bruno's .bru environment format — review variable scopes once, commit the folder, and your team is on git-native API work.",
  ],
  "slack": [
    "Zulip organizes chat by topic inside each channel. A message in #engineering about deploy scripts lives under its own topic, not interleaved with lunch plans. That structure is what teams mean when they say Zulip makes async readable — history stays scannable months later, and threading is mandatory, not optional.",
    "The honest gaps: Slack's third-party integration directory is larger, and some workflows that live as Slack Workflow Builder blocks will need rebuilding. If your team treats chat as a real-time inbox and never reads history, topics will feel like extra work at first.",
    "Migration is tooled: Zulip ships a Slack importer for users, channels and history. Run it against a Slack export, map bots to incoming webhooks, and keep Slack in read-only for a week while people learn topics.",
  ],
  "microsoft-365": [
    "LibreOffice is a full desktop suite — Writer, Calc and Impress — that reads and writes Word, Excel and PowerPoint formats. It runs offline, stores files on your disk, and has no account or subscription attached. For most documents, sheets and slide decks, round-tripping through DOCX/XLSX/PPTX works without reformatting.",
    "The honest gaps: documents heavy on tracked-change histories, complex macros or tightly tuned PowerPoint animations can reflow. Real-time co-editing like Microsoft 365's browser collaboration is not built in — pair it with Nextcloud or Collabora if you need that.",
    "Migration: keep originals, save new work in ODT/ODS when you can, and use DOCX for sharing outside. Open your most important templates first; a quick pass fixing fonts — which often substitute — catches most issues before a wider switch.",
  ],
  "photoshop": [
    "GIMP is a raster editor — layers, masks, selections, retouching tools and a deep plugin system — that has been maintained for decades. It opens PSDs, handles 16-bit per channel, and is scriptable in Python and Scheme for repeatable work.",
    "The honest gaps: non-destructive adjustment layers are weaker than Photoshop's, CMYK for print needs a plugin, and high-end photo management fits better in Darktable or RawTherapee alongside GIMP. Performance on very large canvases is slower.",
    "Migration: GIMP opens layered PSDs directly — check text layers that may rasterize, and reinstall your key brushes and plugins from GIMP's registry. Keep your Lightroom/Darktable catalog separate; GIMP remains an editor, not a full photo manager.",
  ],
  "illustrator": [
    "Inkscape is a vector editor built around SVG as its native format. What you draw is SVG, so files stay portable across web tools, printers and other vector apps. Beziers, node editing, live path effects, clones and extensions cover logos, icons, illustrations and print layouts without proprietary intermediates.",
    "The honest gaps: there is no Figma-style live component library, AI-file import is limited to older versions or exported EPS/PDF, and some newer Illustrator filters have no direct equivalent. Files heavy on mesh gradients or variable fonts need checking.",
    "Migration: ask designers to export .ai files as SVG or PDF — both open cleanly with layers preserved. Rebuild shared swatches as Inkscape palettes, and keep one Illustrator license during transition for legacy files you cannot re-export.",
  ],
  "dropbox": [
    "Nextcloud is a self-hosted file sync and share platform that behaves like Dropbox from the user's view — desktop and mobile clients, share links, versioning and a web interface — plus calendar, contacts and an app ecosystem you can turn on as needed. You control where the data lives.",
    "The honest gaps: you run the server, so you own availability and backups, or you pay for hosted Nextcloud. Initial setup takes longer than creating a Dropbox account, and very large team migrations need planning around quotas and external storage.",
    "Migration: install the Nextcloud desktop client, sync your folders, then recreate share links by re-inviting collaborators. Use the migration assistant for user mapping, and keep Dropbox read-only for a month while you verify share permissions.",
  ],
  "1password": [
    "Bitwarden is a zero-knowledge password manager — browser extensions, desktop and mobile apps, and sync across devices — with optional self-hosting if you want your vault on your own server. Sharing and emergency access are built in.",
    "The honest gaps: 1Password's polished touches — Travel Mode, deeper Watchtower reports and some of the newer passkey flows — are behind or absent. Enterprise policy depth is thinner on Bitwarden's free tier.",
    "Migration: export from 1Password as 1pux or CSV, then import directly into Bitwarden's vault. Verify a handful of logins with attachments and one-time codes before deleting the old vault, and turn on two-factor on the Bitwarden account itself.",
  ],
  "lastpass": [
    "KeePassXC keeps your passwords in one encrypted local file. There is no cloud, no account and no analytics — just a KDBX file you carry. It handles TOTP, password generation, browser integration and auto-type, and the file opens with KeePassDX or Strongbox on phones.",
    "The honest gaps: sync between devices is yours to arrange — Syncthing, a file sync service or a USB copy. Team sharing is file-based, not a web console, and browser integration needs the desktop app running.",
    "Migration: export LastPass to CSV, then Database → Import in KeePassXC. Delete the CSV immediately after import, run the health check for weak or reused entries, and decide on your sync method before adding phones.",
  ],
  "zoom": [
    "Jitsi Meet runs video meetings in the browser — no account, no download for guests. Create a room link, share it, and meet. Public servers exist for quick use, and the full stack is self-hostable with the same features: HD video, screen sharing, chat and recording when you provide the backend.",
    "The honest gaps: cloud recording, large webinar tooling and phone dial-in require hosting and extra components. Meeting performance on very constrained networks is less tuned than Zoom's enterprise edge network.",
    "Migration: there is nothing to export — just share new room links. If you self-host, put Jitsi behind your domain, wire TURN for users behind strict firewalls, and keep your Zoom room for large events until you have tested recording where you need it.",
  ],
  "trello": [
    "Focalboard is a kanban-first project board with properties, filters and templates. It runs as a standalone personal edition or inside Mattermost, which is how the project now lives. Boards, cards, checklists and views cover the core Trello workflow without a per-seat fee.",
    "The honest gaps: Trello's Power-Up ecosystem has no equivalent — checklist add-ons and Butler automations need rebuilding, and enterprise-grade permissions are thinner. Focalboard's future is tied to Mattermost Boards, so follow that project's branch.",
    "Migration: Focalboard's own Trello importer handles JSON exports for boards, lists and cards. Map archived lists before importing, reattach power-up content manually, and keep the original Trello board read-only for a week as a reference.",
  ],
  "asana": [
    "Plane mixes issue tracking, cycles (sprints) and project modules in one tool. It looks and feels close to Asana and Jira, with workspaces, backlogs, boards, roadmaps and an API — and it is self-hostable, so your data can stay on your infrastructure.",
    "The honest gaps: the integration catalog is younger and smaller, reporting is less deep than Asana's portfolios, and some enterprise workflow automations are still maturing. Documentation assumes a technical operator.",
    "Migration: export Asana projects to CSV, import into Plane, then map custom fields and statuses before inviting the team. Rebuild dashboards that relied on Asana's saved searches as Plane views.",
  ],
  "monday": [
    "Wekan is a kanban board system with swimlanes, custom fields, rules and import tooling. Cards, lists, swimlanes and a rule engine cover the visual-board part of Monday with a deliberately simple, utilitarian interface.",
    "The honest gaps: Monday's polished design, time-tracking depth and native CRM views have no direct parallel. Wekan's UI is functional rather than refined, and reporting stays at board level.",
    "Migration: Wekan has importers for Trello boards and JSON. Export from Monday to CSV and map columns to lists, then add swimlanes for workflows Monday handled via status groups. Rules recreate basic automations.",
  ],
  "airtable": [
    "NocoDB turns a database into a smart spreadsheet. Point it at Postgres or MySQL and get grid, gallery, kanban and form views, plus APIs that behave like Airtable's — without row limits or per-seat pricing tied to base size.",
    "The honest gaps: automations are simpler than Airtable's scripting layer, Interface Designer has no equivalent, and permissions are database-centric rather than base-centric.",
    "Migration: export Airtable bases to CSV and import, or connect NocoDB directly to your Postgres or MySQL instance for a live backend. Recreate views and forms in NocoDB, and move scripts to external automations.",
  ],
  "miro": [
    "Excalidraw is a virtual whiteboard with a hand-drawn look. Infinite canvas, shapes and arrows, real-time collaboration and end-to-end encrypted sessions run in the browser with no account needed for a new board.",
    "The honest gaps: it is deliberately sketchy — not a shape-heavy workshop suite. There is no built-in voting, timers or Miro-style enterprise board governance. Boards with hundreds of sticky notes will feel sparser by design.",
    "Migration: scenes save as .excalidraw JSON and images paste directly. Export Miro boards to images or SVG and redraw the sections you actually revisit; archive the rest as PDFs.",
  ],
  "grammarly": [
    "LanguageTool checks grammar and style across 30+ languages and runs wherever you write — browser extension, desktop apps and an editor — with a self-hostable server option that keeps text on your infrastructure. It covers grammar, punctuation and style, not just spelling.",
    "The honest gaps: Grammarly's newer AI rephrasing and tone-adjustment suggestions are stronger, its plagiarism checker is a separate product, and enterprise team management is lighter in LanguageTool.",
    "Migration: there is nothing to export — install the extension and, if you self-host, point it at your server URL. Turn on the languages you actually write in; LanguageTool's suggestions are per-language and less noisy when scoped.",
  ],
  "premiere-pro": [
    "Kdenlive is a multi-track video editor with a full timeline, effects, transitions, proxy editing and titling. It runs on Linux, Windows and macOS, handles 4K with proxies, and saves projects to a portable XML format.",
    "The honest gaps: there is no cloud collaboration like Premiere's cloud workflows, team project sharing is file-based, and some newer camera format support lags. Very complex Premiere projects reimport imperfectly.",
    "Migration: relink media manually and rebuild titles; use EDL or XML intermediates to carry timelines where possible. Keep your Premiere projects read-only and export finals as masters while you learn Kdenlive's scopes and proxies.",
  ],
  "tableau": [
    "Metabase lets teams ask questions of data without writing SQL, and lets analysts write it when they need to. Visual query builder, full SQL editor, dashboards, alerts and scheduled reports run from a single jar or Docker image against your warehouse.",
    "The honest gaps: advanced geospatial analytics, story-driven dashboards and some enterprise governance features are lighter than Tableau's. Heavy workbook governance and Tableau-specific calculations will need rethinking.",
    "Migration: connect Metabase directly to your warehouse — there is nothing to export from Tableau for dashboards, so rebuild the key ones. Start with the five most viewed, which usually cover most of the value.",
  ],
  "auth0": [
    "Authentik is an identity provider with OIDC, SAML and LDAP — SSO, MFA, social logins and user management you run yourself. Flows are visual, so login, enrollment and recovery are workflows you can see and change.",
    "The honest gaps: you operate the uptime and patching yourself, auth0's anomaly detection and some enterprise compliance attestations have no built-in equivalent, and scaling for very large tenant counts needs planning.",
    "Migration: recreate applications and providers in Authentik, bulk-import users via CSV or API, then cut over one app at a time behind a proxy. Keep Auth0 as a fallback identity provider during transition so a bad mapping does not lock users out.",
  ],
  "heroku": [
    "Coolify is a self-hosted PaaS that covers the Heroku workflow — git-push deploys, managed databases, automatic SSL and preview environments — on any VPS you rent. One instance hosts many apps.",
    "The honest gaps: you rent and maintain the underlying VPS, so you own OS updates, backups and capacity planning. Heroku's add-on marketplace is replaced by running the services yourself inside Coolify.",
    "Migration: point Coolify at your existing git repos, add environment variables, and deploy. Expect to add a $5–$10 per month VPS to your honest total cost; compare that to per-dyno and add-on fees you currently pay.",
  ],
  "todoist": [
    "Vikunja organizes tasks with lists, labels, filters, kanban, gantt and reminders. It is a single Go binary or Docker image, so deployment is a file and a flag, and data stays on your machine or server.",
    "The honest gaps: Todoist's natural-language input — 'every Friday at 5pm #work p1' — is less refined, and smart filters have fewer presets. Karma and some of the newer AI scheduling hints have no equivalent.",
    "Migration: use Vikunja's Todoist migrator with a Todoist backup (JSON or CSV). Map projects to lists or namespaces during import, then recreate filters as saved views. Check recurring rules once — recurrence syntax differs.",
  ],
  "spotify": [
    "Navidrome streams the music files you already own. Point it at a folder and get a Subsonic-compatible server with playlists, multi-user support and clients on every platform. It is tiny on resources and honest about scope: it streams your collection, not a label catalog.",
    "The honest gaps: there is no catalog of new releases or podcasts — it only plays what you have. Discovery features are limited to your library's metadata, and social sharing is file-oriented rather than platform-native.",
    "Migration: drop your audio files into a folder, point Navidrome at it, and let it scan. Keep your folder structure clean; Navidrome reads what is on disk, so consistent tagging before the first scan saves cleanup later.",
  ],
  "jira": [
    "OpenProject is a mature work-management suite — scrum boards, gantt charts, issue tracking, wikis and enterprise-grade permissions — with an emphasis on data control. It runs self-hosted and is built for teams that need structured project governance.",
    "The honest gaps: Jira's marketplace apps have no direct equivalent — each integration needs evaluation — and very large Jira instances with heavy automation will need rebuilding.",
    "Migration: export Jira issues to CSV and import with field mapping. Bring sprints, epics and custom fields across first; reattach large attachments after and re-create boards from queries rather than expecting them to import pixel-perfect.",
  ],
  "evernote": [
    "Joplin stores notes as Markdown with end-to-end encrypted sync across Dropbox, OneDrive, WebDAV or Joplin Cloud. Notebooks, tags, search, a web clipper and a plugin system cover the Evernote workflow in an open format you control.",
    "The honest gaps: real-time shared-notebook collaboration is thinner than Evernote's web sharing, handwriting stays raster-based, and importing very large Evernote accounts with thousands of notebooks can be slow.",
    "Migration: Joplin imports Evernote .enex files natively, including attachments. Import notebook by notebook, let sync finish between batches, and check embedded PDFs — they carry across but search indexing catches up after sync.",
  ],
  "lightroom": [
    "Darktable is a non-destructive RAW workflow: a lighttable for culling, organizing and tagging, and a darkroom for editing. Presets, modules and parametric masks replace Lightroom's sliders, and everything stays in sidecars next to your files.",
    "The honest gaps: there is no Lightroom-mobile or cloud sync, face detection is more basic, and catalog import is file-based — expect to recreate smart collections and re-edit hero shots rather than getting pixel-identical results from LR presets.",
    "Migration: keep your originals and XMP sidecars — Darktable reads what it can, but plan to rebuild collections as tags and re-edit selects. Process a dozen test raws first to decide which Lightroom presets are worth recreating as Darktable styles.",
  ],
  "docker-desktop": [
    "Podman Desktop manages containers without a daemon — pods, compose, Kubernetes workflows and Docker-compatible CLI behavior — and it is free for organizations of any size. The podman CLI aliases the docker command, so existing commands often just work.",
    "The honest gaps: a few niche Docker Desktop extensions have no build, some volume-mount edge cases differ on macOS, and the dashboard is newer than Docker Desktop's, so expect minor UI gaps.",
    "Migration: alias podman as docker or change the binary path, then run `podman compose up` against your existing files. Most compose files work unchanged; check bind mounts that relied on Docker Desktop's file-sharing specifics.",
  ],
};

const catalog = JSON.parse(fs.readFileSync("src/data/alternatives.json", "utf8"));
let n = 0;
for (const p of catalog.pairings) {
  if (!p.editorial) {
    const content = EDITORIAL[p.paidTool.slug];
    if (!content) {
      console.warn(`MISSING editorial for ${p.paidTool.slug}`);
      continue;
    }
    p.editorial = content.map((body) => ({ body }));
    n++;
  }
}
fs.writeFileSync("src/data/alternatives.json", JSON.stringify(catalog, null, 2) + "\n");
console.log(`editorial written for ${n} remaining pairings`);
