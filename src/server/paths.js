import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export function getUserDataDir() {
  const home = os.homedir();
  let base;
  switch (process.platform) {
    case "win32":
      base = path.join(process.env.LOCALAPPDATA || path.join(home, "AppData", "Local"), "opensource-hub");
      break;
    case "darwin":
      base = path.join(home, "Library", "Application Support", "opensource-hub");
      break;
    default:
      base = path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "opensource-hub");
  }
  fs.mkdirSync(base, { recursive: true });
  return base;
}
