"""CLI entry point for `claude-init` command."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .core import init


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="claude-init",
        description="Initialize a Claude Code project structure in a directory.",
    )
    parser.add_argument(
        "target",
        nargs="?",
        default=".",
        help="Target directory (default: current directory)",
    )
    args = parser.parse_args()
    target = Path(args.target).resolve()

    print(f"\n Initializing Claude Code structure in: {target}\n")
    try:
        init(target)
        print(" Done! Claude Code structure created successfully.")
        print("\nNext steps:")
        print("  1. Edit CLAUDE.md with your project details")
        print("  2. Update .claude/rules/ to match your team conventions")
        print("  3. Configure .mcp.json with your integrations\n")
    except Exception as exc:  
        print(f" Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
