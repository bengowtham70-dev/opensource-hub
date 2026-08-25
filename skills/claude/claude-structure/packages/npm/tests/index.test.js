'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { init } = require('../src/index');

describe('claude-code-structure', () => {
    it('should export init function', () => {
        assert.strictEqual(typeof init, 'function');
    });

    it('should throw when targetDir is not provided', () => {
        assert.throws(() => init(), /targetDir is required/);
        assert.throws(() => init(null), /targetDir is required/);
        assert.throws(() => init(''), /targetDir is required/);
    });

    it('should create structure in target directory', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
        try {
            init(tmpDir);
            assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.mcp.json')), '.mcp.json should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json')), 'settings.json should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'code-style.md')), 'code-style.md should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'hooks', 'validate-bash.sh')), 'validate-bash.sh should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'review.md')), 'review.md should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'agents', 'code-reviewer.md')), 'code-reviewer.md should exist');
            assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'deploy', 'SKILL.md')), 'SKILL.md should exist');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('should create target directory if it does not exist', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
        const targetDir = path.join(tmpDir, 'new-project');
        try {
            assert.ok(!fs.existsSync(targetDir), 'target should not exist yet');
            init(targetDir);
            assert.ok(fs.existsSync(targetDir), 'target should be created');
            assert.ok(fs.existsSync(path.join(targetDir, 'CLAUDE.md')), 'CLAUDE.md should exist');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('should be idempotent (running twice should not throw)', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-test-'));
        try {
            init(tmpDir);
            init(tmpDir); // should not throw
            assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')));
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
