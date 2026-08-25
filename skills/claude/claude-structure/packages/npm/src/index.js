'use strict';

/**
 * claude-code-structure
 * Programmatic API to initialize Claude Code project structure.
 */

const fs = require('fs');
const path = require('path');

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

/**
 * Initialize Claude Code structure into the target directory.
 * @param {string} targetDir - Absolute path to the target directory.
 */
function init(targetDir) {
    if (!targetDir) throw new Error('targetDir is required');
    copyDir(TEMPLATE_DIR, path.resolve(targetDir));
}

module.exports = { init };
