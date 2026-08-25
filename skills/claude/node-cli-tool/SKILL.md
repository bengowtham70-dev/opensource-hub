---
name: node-cli-tool
description: Production patterns for building zero-config Node.js global CLI tools, local daemon servers, cross-platform binary runners (Windows/macOS/Linux), and auto-browser opening.
---

# Node.js CLI Tool & Local Daemon Architecture

## 1. CLI Entrypoint (`bin/cli.js`)
- Must contain shebang: `#!/usr/bin/env node`
- Use lightweight argument parsing (`commander` or `cac`).
- Graceful port conflict handling: if port 3000 is occupied, auto-increment to 3001, 3002 with friendly console messaging.
- Auto-open browser: use `open` package with fallback to OS native commands (`start`, `open`, `xdg-open`).

## 2. Cross-Platform OS Binary Management
- **Windows:** Target `.exe` / `.msi` assets. Handle PowerShell path spaces with proper quoting.
- **macOS:** Target `.dmg` / `.pkg` / universal `.zip`.
- **Linux:** Target `.AppImage` / `.deb` / `.tar.gz`. Make AppImage executable (`chmod +x`).

## 3. Local Storage & Cache Pathing
- Use standard user data directories:
  - Windows: `%LOCALAPPDATA%/opensource-hub`
  - macOS: `~/Library/Application Support/opensource-hub`
  - Linux: `~/.config/opensource-hub`
- Normalize paths with `path.join()` and `path.resolve()`. Never hardcode `/` or `\`.
