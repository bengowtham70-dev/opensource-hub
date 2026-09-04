import test from "node:test";
import assert from "node:assert/strict";
import {
  getMigrationPlan,
  generateMarkdownRunbook,
  deriveMigrationSteps,
} from "../dashboard/src/lib/migration-plans.js";

test("getMigrationPlan loads 5-stage plan for configured pairing", () => {
  const plan = getMigrationPlan("supabase/supabase", { name: "Supabase" });
  assert.equal(plan.paidTool, "Firebase");
  assert.equal(plan.alternative, "Supabase");
  assert.equal(plan.stages.length, 5);
  assert.equal(plan.stages[0].id, "export");
  assert.equal(plan.stages[1].id, "setup");
  assert.equal(plan.stages[2].id, "import");
  assert.equal(plan.stages[3].id, "cutover");
  assert.equal(plan.stages[4].id, "verify");
  assert.ok(plan.stages[0].steps.length > 0);
});

test("getMigrationPlan synthesizes intelligent 5-stage plan for fallback repo", () => {
  const plan = getMigrationPlan("custom/tool", {
    name: "CustomTool",
    paidTool: { name: "EnterpriseSaaS" },
    platforms: ["self-host"],
  });

  assert.equal(plan.paidTool, "EnterpriseSaaS");
  assert.equal(plan.alternative, "CustomTool");
  assert.equal(plan.stages.length, 5);
  assert.ok(plan.stages[1].steps.some((s) => s.includes("Docker Compose")));
});

test("generateMarkdownRunbook renders Markdown with checked tasks and metadata", () => {
  const plan = getMigrationPlan("usebruno/bruno", { name: "Bruno" });
  const checkedSteps = { export_0: true, setup_0: true };
  const md = generateMarkdownRunbook(plan, "usebruno/bruno", checkedSteps);

  assert.ok(md.includes("# Migration Runbook: Postman ➔ Bruno"));
  assert.ok(md.includes("- [x] In Postman, click on your Collection's '...' menu and choose 'Export'."));
  assert.ok(md.includes("- [ ] Select 'Collection v2.1 (recommended)' and save the .json file locally."));
  assert.ok(md.includes("OpenSource Hub"));
});
