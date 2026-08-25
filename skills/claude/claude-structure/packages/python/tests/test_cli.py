"""Tests for claude_code_structure."""

import sys
from pathlib import Path

# Ensure the package is importable from source
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import tempfile
import pytest
from claude_code_structure import init


def test_init_creates_structure(tmp_path: Path) -> None:
    init(tmp_path)
    assert (tmp_path / "CLAUDE.md").exists()
    assert (tmp_path / ".claude" / "rules" / "code-style.md").exists()
    assert (tmp_path / ".claude" / "hooks" / "validate-bash.sh").exists()


def test_init_idempotent(tmp_path: Path) -> None:
    init(tmp_path)
    init(tmp_path)  # Should not raise


def test_init_creates_target_dir(tmp_path: Path) -> None:
    target = tmp_path / "new_project"
    assert not target.exists()
    init(target)
    assert target.exists()
