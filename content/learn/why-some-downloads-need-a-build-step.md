---
title: Why some downloads need a build step
description: The honest reason "Run it" works for some tools and not others.
order: 4
---

# Why some downloads need a build step

Computers run machine code, but humans write source code. A **build step** translates between the two — like baking: ingredients (source) go in, a cake (.exe/.dmg/AppImage) comes out.

## Two kinds of projects

**Packaged releases** — the maintainers already did the baking and attached the finished file to a GitHub Release. You download, double-click, done. Same as installing Spotify.

**Source-only projects** — nobody baked it for your exact system. You (or a developer friend) run one or two commands that do the baking on your machine. There is no way around this step; any website claiming otherwise would be lying.

## How this app tells you which is which

Every listing shows an honest split:

- **"Run App"** appears only when the project ships a packaged installer for *your* operating system.
- **"Download Source"** links the raw code with plain-language setup notes when a build step is required.

No tool pretends to be easier to install than it actually is.

## And no, nothing runs without your click

Browsers and operating systems deliberately block silent downloads-and-runs — that's malware protection working as intended. Every install here starts with your explicit click, then your explicit double-click.
