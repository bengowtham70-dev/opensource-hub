import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMarkdownSections,
  categorizeSection,
  heuristicAnswer,
  answerRepoQuestion,
} from "../src/server/repo-assistant.js";

const SAMPLE_MD = `
# Smolagents

🤗 a barebones library for agents that think in code.

## Installation

Run pip to install:
\`\`\`bash
pip install smolagents
\`\`\`

## Configuration & Environment Variables

Export your Hugging Face or OpenAI API token:
\`\`\`bash
HF_TOKEN="hf_xyz123"
OPENAI_API_KEY="sk-abc123"
\`\`\`

## Docker Deployment

To launch in a container:
\`\`\`yaml
version: '3.8'
services:
  agent:
    image: huggingface/smolagents:latest
    ports:
      - "8080:8080"
\`\`\`
`;

test("parseMarkdownSections extracts headings, text, and fenced code blocks", () => {
  const sections = parseMarkdownSections(SAMPLE_MD);
  assert.equal(sections.length >= 3, true);
  const installSec = sections.find((s) => s.title.includes("Installation"));
  assert.ok(installSec);
  assert.equal(installSec.codeBlocks.length, 1);
  assert.equal(installSec.codeBlocks[0].lang, "bash");
  assert.match(installSec.codeBlocks[0].code, /pip install smolagents/);
});

test("categorizeSection classifies headings into semantic categories", () => {
  assert.equal(categorizeSection("Installation & Setup"), "install");
  assert.equal(categorizeSection("Environment Variables & API Keys"), "config");
  assert.equal(categorizeSection("Docker Compose"), "docker");
  assert.equal(categorizeSection("API Usage & Quickstart"), "install");
});

test("heuristicAnswer handles installation queries", () => {
  const sections = parseMarkdownSections(SAMPLE_MD);
  const res = heuristicAnswer({
    question: "How do I install smolagents?",
    sections,
    repoMeta: { name: "smolagents", language: "Python" },
  });
  assert.equal(res.source, "local_ast");
  assert.match(res.answer, /pip install smolagents/);
  assert.equal(res.codeSnippets.length >= 1, true);
});

test("heuristicAnswer handles environment variables and API keys queries", () => {
  const sections = parseMarkdownSections(SAMPLE_MD);
  const res = heuristicAnswer({
    question: "What API keys or env vars are needed?",
    sections,
    repoMeta: { name: "smolagents", language: "Python" },
  });
  assert.equal(res.source, "local_ast");
  assert.match(res.answer, /HF_TOKEN/);
  assert.match(res.answer, /OPENAI_API_KEY/);
});

test("heuristicAnswer handles Docker deployment queries", () => {
  const sections = parseMarkdownSections(SAMPLE_MD);
  const res = heuristicAnswer({
    question: "How do I run this with Docker?",
    sections,
    repoMeta: { name: "smolagents", language: "Python" },
  });
  assert.equal(res.source, "local_ast");
  assert.match(res.answer, /docker/i);
  assert.match(res.answer, /version:\s*'3.8'/);
});

test("answerRepoQuestion validates non-empty question and falls back safely", async () => {
  await assert.rejects(
    async () => answerRepoQuestion({ question: "", markdown: SAMPLE_MD }),
    /Question cannot be empty/
  );

  const res = await answerRepoQuestion({
    question: "What are the trade-offs vs proprietary alternatives?",
    markdown: SAMPLE_MD,
    repoMeta: { name: "smolagents", language: "Python", license: { spdx: "Apache-2.0" } },
    ollamaEndpoint: "http://127.0.0.1:59999", // dead port, forces offline fallback
  });
  assert.ok(res.answer);
  assert.match(res.answer, /Data Sovereignty/);
  assert.equal(res.source, "local_ast");
});
