import migrationsData from "../../../src/data/migrations.json" with { type: "json" };

export function deriveMigrationSteps(paidTool = {}, alternative = {}) {
  const paidName = paidTool.name || "Proprietary SaaS";
  const altName = alternative.name || "Open Source Alternative";

  return [
    {
      step: 1,
      title: `Export data from ${paidName}`,
      desc: `Open your ${paidName} workspace settings, select "Export Workspace", and choose JSON, CSV, or Markdown format.`,
    },
    {
      step: 2,
      title: "Review & verify schema",
      desc: `Ensure your attachments, media assets, and relational records are included in the downloaded archive.`,
    },
    {
      step: 3,
      title: `Import directly into ${altName}`,
      desc: `Launch ${altName}, navigate to Settings → Data Import, and drag-and-drop your exported archive for 100% loss-free import.`,
    },
  ];
}

export function getMigrationPlan(repo = "", alternative = {}) {
  const normRepo = (repo || alternative.repo || "").toLowerCase();
  
  if (migrationsData[normRepo]) {
    return migrationsData[normRepo];
  }

  // Generic intelligent 5-stage synthesis for any tool in the catalog
  const paidName = alternative.paidTool?.name || "the commercial service";
  const toolName = alternative.name || normRepo.split("/")[1] || "the open-source alternative";
  const language = (alternative.language || "").toLowerCase();
  const isDocker = (alternative.platforms || []).includes("self-host");

  return {
    paidTool: paidName,
    alternative: toolName,
    estimatedDuration: isDocker ? "20-30 minutes" : "10-15 minutes",
    difficulty: isDocker ? "Intermediate" : "Beginner",
    stages: [
      {
        "id": "export",
        "name": "Data & Configuration Export",
        "badge": "Step 1",
        "description": `Export all workspaces, records, and media assets from ${paidName}.`,
        "steps": [
          `Export data from ${paidName}`,
          `Navigate to ${paidName} Settings > Export Data.`,
          "Select full JSON/CSV export including all media attachments and user profiles.",
          "Store the downloaded archive securely on your local disk."
        ],
        "tip": `Review ${paidName}'s export format documentation for schema nuances.`
      },
      {
        "id": "setup",
        "name": "Target Environment Setup",
        "badge": "Step 2",
        "description": `Provision and launch ${toolName} on your preferred infrastructure.`,
        "steps": [
          isDocker
            ? `Run ${toolName} using Docker Compose with persistent volume mounts.`
            : `Download and install the latest release of ${toolName} from GitHub releases.`,
          "Configure administrative credentials and initial environment settings.",
          "Verify the dashboard or interface is accessible over localhost or your internal network."
        ],
        "tip": "Ensure database and persistent volume directories are backed up regularly."
      },
      {
        "id": "import",
        "name": "Data Ingestion & Schema Translation",
        "badge": "Step 3",
        "description": `Import data from your ${paidName} export into ${toolName}.`,
        "steps": [
          `Import directly into ${toolName}`,
          `Locate the Import utility within ${toolName} (or run the community migration script).`,
          "Upload your exported datasets and map fields to the new schema format.",
          "Validate that records, tags, and relational linkages match the original structure."
        ],
        "tip": "For large datasets (>1GB), consider batch-importing via CLI or script to avoid browser timeouts."
      },
      {
        "id": "cutover",
        "name": "Team & Workflow Cut-Over",
        "badge": "Step 4",
        "description": `Switch active user traffic, webhooks, and client integrations over to ${toolName}.`,
        "steps": [
          "Invite team members and assign appropriate role permissions.",
          "Update webhook endpoints, DNS records, and API keys in your external apps.",
          `Begin daily workflows on ${toolName} while keeping ${paidName} in read-only mode.`
        ],
        "tip": "Run parallel for 3-5 days to ensure no edge cases or missing integrations emerge."
      },
      {
        "id": "verify",
        "name": "Parity Verification & Decommissioning",
        "badge": "Step 5",
        "description": `Perform final integrity audit and cancel paid subscription to ${paidName}.`,
        "steps": [
          "Confirm all team members are actively using the open-source platform.",
          "Verify automated offsite backups are executing smoothly.",
          `Cancel your paid ${paidName} subscription to lock in your recurring cost savings.`
        ],
        "tip": "Celebrate reclaiming data sovereignty and zero vendor lock-in!"
      }
    ]
  };
}

export function generateMarkdownRunbook(plan, repo, checkedSteps = {}) {
  const date = new Date().toISOString().split("T")[0];
  let md = `# Migration Runbook: ${plan.paidTool} ➔ ${plan.alternative}\n\n`;
  md += `**Target Repository:** \`${repo}\`  \n`;
  md += `**Estimated Duration:** ${plan.estimatedDuration}  \n`;
  md += `**Difficulty Level:** ${plan.difficulty}  \n`;
  md += `**Generated Date:** ${date} via [OpenSource Hub](https://github.com/bengowtham70/opensource-hub)\n\n`;
  md += `---\n\n`;

  for (const stage of plan.stages) {
    md += `## ${stage.badge}: ${stage.name}\n`;
    md += `*${stage.description}*\n\n`;
    
    stage.steps.forEach((step, idx) => {
      const stepKey = `${stage.id}_${idx}`;
      const isDone = Boolean(checkedSteps[stepKey]);
      md += `- [${isDone ? "x" : " "}] ${step}\n`;
    });

    if (stage.tip) {
      md += `\n> **Pro-Tip:** ${stage.tip}\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;
  md += `*Runbook exported from OpenSource Hub — Local-First Open Source Intelligence.*`;
  return md;
}

export function getStoredMigrationProgress(repo) {
  if (!repo || typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`osh-migration-${repo.toLowerCase()}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredMigrationProgress(repo, checkedSteps) {
  if (!repo || typeof window === "undefined") return;
  try {
    localStorage.setItem(`osh-migration-${repo.toLowerCase()}`, JSON.stringify(checkedSteps));
  } catch {}
}
