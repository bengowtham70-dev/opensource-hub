---
name: mattpocock-grilling
description: Socratic decision-tree questioning workflow from Matt Pocock to relentlessly stress-test plans, architecture decisions, and edge cases before writing code.
---

# Socratic Design Grilling (Matt Pocock)

## Workflow
1. Map the proposed architecture or feature as a **design tree**: every decision branches into dependencies that hang off it.
2. Identify the **frontier**: every decision whose prerequisites are already settled.
3. Present the frontier in structured rounds:
   - ❓ **Q1 — [Question Title]:** Detail the tradeoff and multi-choice options.
   - ➡️ **[Recommended Answer]:** Clearly state the best-practice path.
4. Wait for resolution before writing code to prevent costly architectural rewrites.
