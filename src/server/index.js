import chalk from "chalk";
import open from "open";
import { createApp } from "./app.js";
import { findAvailablePort } from "./find-port.js";
import { getPackageVersion } from "./version.js";
import { getUserDataDir } from "./paths.js";
import { checkForUpdate } from "./update-check.js";
import { initEmbeddedPayload } from "./repo-files.js";

// PRD §14 / PLAN_PHASE2 Phase 9 — non-intrusive update notice, checked in the
// background after startup so a slow/offline network can never delay the boot.
function notifyUpdateIfAvailable() {
  if (process.env.OPENSOURCE_HUB_NO_UPDATE_NOTIFIER === "1") return;
  checkForUpdate({ currentVersion: getPackageVersion(), cacheDir: getUserDataDir() })
    .then((update) => {
      if (!update) return;
      console.log(
        chalk.yellow(
          `  ⚠ Update available: v${update.currentVersion} → v${update.latest}` +
            chalk.gray(" · Run: ") +
            chalk.bold("npm i -g opensource-hub")
        )
      );
    })
    .catch(() => {
      /* notifier must never take the server down */
    });
}

export async function run({ preferredPort = 3000, openBrowser = true }) {
  // plans/PLAN_PHASE2.md Phase 9 — register embedded assets before any read
  // (no-op on npm installs where payload.generated.js was never shipped).
  await initEmbeddedPayload();
  const { app, hasBuild } = createApp();

  const envPort = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : null;
  const initialPort = envPort || preferredPort;

  let port;
  try {
    port = await findAvailablePort(initialPort);
  } catch (err) {
    console.error(chalk.red(`\n  ✖ ${err.message}\n`));
    process.exit(1);
  }

  if (port !== initialPort) {
    console.log(chalk.yellow(`  ⚠ Port ${initialPort} is in use — starting on ${chalk.bold(port)} instead.`));
  }

  const host = process.env.HOST || (process.env.RENDER || process.env.PORT ? "0.0.0.0" : "127.0.0.1");
  const server = app.listen(port, host, () => {
    const url = `http://localhost:${port}`;
    console.log("");
    console.log(chalk.hex("#FF5722").bold("  ◆ OpenSource Hub") + chalk.gray(` v${getPackageVersion()}`));
    console.log(chalk.gray("  ─────────────────────────────────────────"));
    console.log(`  ${chalk.green("●")} Dashboard running at ${chalk.cyan.underline(url)}`);
    if (!hasBuild) {
      console.log(chalk.yellow(`  ⚠ Dashboard UI not built yet. Run ${chalk.bold("npm run build")} first.`));
    }
    console.log(`  ${chalk.gray("Press Ctrl+C to stop.")}`);
    console.log("");

    if (openBrowser) {
      open(url).catch(() => {
        console.log(chalk.gray(`  Open ${url} manually in your browser.`));
      });
    }
    notifyUpdateIfAvailable();
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return server;
}
