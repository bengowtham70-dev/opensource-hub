#!/usr/bin/env node
'use strict';

/**
 * sync-template.js
 * Copies the shared template/ directory into both npm and python packages.
 * Run before publishing to ensure bundled templates are up-to-date.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE_SRC = path.join(ROOT, 'template');
const TARGETS = [
    path.join(ROOT, 'packages', 'npm', 'template'),
    path.join(ROOT, 'packages', 'python', 'claude_code_structure', 'template'),
];

function copyDir(src, dest) {
    // Remove existing to ensure clean sync
    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (!fs.existsSync(TEMPLATE_SRC)) {
    console.error(`ERROR: Template source not found: ${TEMPLATE_SRC}`);
    process.exit(1);
}

for (const target of TARGETS) {
    console.log(`Syncing template → ${path.relative(ROOT, target)}`);
    copyDir(TEMPLATE_SRC, target);
}

console.log('Template sync complete.');
