// One-off: replace P6 editorial placeholders with hand-written reviews for the
// top 3 pairings. AGENTS.md anti-slop rules: concrete, honest about gaps, no
// marketing tells ("seamless", "game-changer", "effortless" are banned).
import fs from "node:fs";

const EDITORIAL = {
  notion: [
    "AFFiNE blends three things Notion keeps separate — documents, kanban databases and an infinite whiteboard — into one canvas. Anything you write can be turned into board rows; anything on the board can be opened as a page. Storage is local-first, so your workspace keeps working when the internet doesn't, and syncing is end-to-end encrypted.",
    "The honest gaps: Notion's template gallery is orders of magnitude larger, its database formulas go deeper, and AFFiNE's mobile apps are younger. If your team runs on formula-heavy Notion databases, pilot the importer with one workspace before committing — complex relations and rollups sometimes need manual rebuilding.",
    "Migration is genuinely low-friction: export Notion pages to Markdown and CSV, then use AFFiNE's built-in Notion importer. Attachments come across; permissions don't, so plan a quick pass re-sharing with your team. Start with one workspace, run it alongside Notion for a week, then cut over.",
  ],
  figma: [
    "Penpot is built on open web standards — every frame is real SVG, every file is a zip of SVGs you can open anywhere. That single decision explains most of its character: no proprietary format holding your work hostage, self-hosting if you want it, and a dev-handoff mode that speaks in code, not pixels.",
    "The honest gaps: Figma's plugin marketplace dwarfs Penpot's community libraries, auto-layout behaves differently in edge cases, and .fig import is partial — complex effects and some vector networks arrive simplified. Teams with deep shared-component libraries should budget a rebuild sprint rather than expecting a clean import.",
    "Migration that works: recreate your shared libraries first (they're the highest-leverage asset), export frames to SVG, and lean on Penpot's Figma migration guide for the rest. Design tokens in JSON travel perfectly; fancy blur and noise effects rarely do. Keep one Figma seat during the transition for old files.",
  ],
  firebase: [
    "Supabase bets everything on one decision: your backend is Postgres. That means real SQL, any Postgres extension, and — critically — the ability to leave. Auth, auto-generated REST and GraphQL APIs, realtime subscriptions, file storage, edge functions and pgvector search all hang off that same database, so there's no proprietary store you'll eventually outgrow.",
    "The honest gaps: Firestore's offline-first sync semantics are genuinely different — if your mobile app depends on them, budget real rework. Firebase's ancillary services (remote config, analytics, A/B testing) have no built-in equivalent; you'll pick standalone tools. And with self-hosting comes the responsibility of your own uptime.",
    "Migration path: export Firestore collections to JSON and transform them into SQL tables (relations you designed around in Firestore become actual foreign keys). Auth users move via the admin API with password hashes for most providers. Supabase holds SOC2 Type 2 and HIPAA compliance on paid plans, which matters for regulated teams.",
  ],
};

const catalog = JSON.parse(fs.readFileSync("src/data/alternatives.json", "utf8"));
let n = 0;
for (const p of catalog.pairings) {
  const content = EDITORIAL[p.paidTool.slug];
  if (content) {
    p.editorial = content.map((body) => ({ body }));
    n++;
  }
}
fs.writeFileSync("src/data/alternatives.json", JSON.stringify(catalog, null, 2) + "\n");
console.log(`editorial written for ${n} pairings`);
