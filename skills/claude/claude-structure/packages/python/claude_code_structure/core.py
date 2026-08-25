"""Core logic: copy template into target directory."""

from __future__ import annotations

import shutil
from pathlib import Path

# The template is bundled inside this package at claude_code_structure/template/
TEMPLATE_DIR = Path(__file__).resolve().parent / "template"


def init(target_dir: str | Path) -> None:
    """Initialize Claude Code structure into *target_dir*.

    Args:
        target_dir: Path to the destination directory (created if missing).

    Raises:
        FileNotFoundError: If the bundled template directory is missing.
    """
    target = Path(target_dir).resolve()
    if not TEMPLATE_DIR.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE_DIR}")

    target.mkdir(parents=True, exist_ok=True)
    shutil.copytree(str(TEMPLATE_DIR), str(target), dirs_exist_ok=True)
