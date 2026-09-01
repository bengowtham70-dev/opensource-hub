// Parity P4 (plans/PLAN_PARITY.md) — category → group taxonomy.
// Single client-side source of truth. The schema test (test/schema.test.js)
// imports THIS file and enforces: every catalog category covered, no orphans,
// no empty groups. Server-side code that needs the taxonomy should import here
// too rather than duplicating the map.
export const GROUPS = [
  {
    slug: "work-docs",
    label: "Work & Docs",
    description: "Writing, knowledge, planning and the office suite that ties them together.",
    categories: ["Notes & Docs", "Notes", "Office Suite", "Writing", "Whiteboard", "Project Management", "Documentation", "Documents", "Scheduling", "CRM", "Publishing", "Forms", "Commerce", "Finance", "Marketing"],
  },
  {
    slug: "create",
    label: "Create",
    description: "Design, image, video and audio — the creative subscription stack.",
    categories: ["Design", "Creative", "Music", "Photos", "Media", "Video", "CAD"],
  },
  {
    slug: "secure",
    label: "Secure",
    description: "Passwords, keys and identity — own your authentication layer.",
    categories: ["Security", "Identity"],
  },
  {
    slug: "build",
    label: "Build",
    description: "The developer platform: APIs, backends, databases, deploys and analytics.",
    categories: ["API Client", "Backend", "Deployment", "Developer Tools", "Databases", "Analytics", "Automation", "Storage", "Monitoring", "Engineering", "Smart Home"],
  },
  {
    slug: "collaborate",
    label: "Collaborate",
    description: "Chat, meetings and files — teamwork without per-seat rent.",
    categories: ["Communication", "Team Chat", "Video Conferencing", "Files & Sync", "Support", "Social"],
  },
  {
    slug: "everyday",
    label: "Everyday",
    description: "Personal productivity — tasks, habits and daily tools.",
    categories: ["Productivity"],
  },
];

const BY_CATEGORY = new Map();
for (const g of GROUPS) {
  for (const c of g.categories) BY_CATEGORY.set(c, g);
}

export function groupForCategory(category) {
  return BY_CATEGORY.get(category) || null;
}

export function allGroups() {
  return GROUPS;
}
