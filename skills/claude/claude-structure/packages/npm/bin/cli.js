#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const TEMPLATE_DIR = path.join(__dirname, '..', 'template');

function copyDir(src, dest) {
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

console.log(`\n Initializing Claude Code structure in: ${TARGET_DIR}\n`);
copyDir(TEMPLATE_DIR, TARGET_DIR);
console.log(' Done! Claude Code structure created successfully.');
console.log('\nNext steps:');
console.log('  1. Edit CLAUDE.md with your project details');
console.log('  2. Update .claude/rules/ to match your team conventions');
console.log('  3. Configure .mcp.json with your integrations\n');
