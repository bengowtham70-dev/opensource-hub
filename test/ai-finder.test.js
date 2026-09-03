import { test } from "node:test";
import assert from "node:assert/strict";
import { heuristicFind, tokenize, findTools } from "../src/server/ai-finder.js";
import { getPairings } from "../src/server/data.js";

const pairings = getPairings();

test("tokenizer strips stopwords and punctuation", () => {
  const words = tokenize("I need to manage client invoices for my agency!");
  assert.ok(!words.includes("i") && !words.includes("need") && !words.includes("for"));
  assert.ok(words.includes("manage") === false || words.includes("invoices"));
  assert.ok(words.includes("invoices"), JSON.stringify(words));
});

test("offline heuristic matches by paid-tool name, category and tags", () => {
  const items = heuristicFind("invoice tool like the one I pay for", pairings);
  assert.ok(items.length > 0);
  const items2 = heuristicFind("passwords", pairings);
  assert.ok(items2.some((i) => ["bitwarden/clients", "keepassxreboot/keepassxc"].includes(i.repo)));
  assert.ok(items2.every((i) => i.reason.length > 5 && i.confidence > 0));
});

test("no API key → offline mode, never throws", async () => {
  const r = await findTools({ task: "team chat", pairings, apiKey: "" });
  assert.equal(r.mode, "offline");
  assert.ok(r.items.length > 0);
});

test("AI mode: valid structured response is validated and mapped", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "For API testing, Bruno fits best.",
                items: [
                  { repo: "usebruno/bruno", reason: "Offline-first API client", confidence: 0.92 },
                  { repo: "not-in-catalog/fake", reason: "should be dropped", confidence: 0.9 },
                ],
              }),
            },
          },
        ],
      }),
      { status: 200 }
    );
  const r = await findTools({ task: "api client", pairings, apiKey: "sk-test", fetchImpl });
  assert.equal(r.mode, "ai");
  assert.equal(r.items.length, 1); // fake repo dropped by catalog validation
  assert.equal(r.items[0].repo, "usebruno/bruno");
  assert.ok(r.items[0].confidence <= 1);
});

test("AI refusal falls back to offline honestly", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { refusal: "cannot help with that" } }] }),
      { status: 200 }
    );
  const r = await findTools({ task: "something", pairings, apiKey: "sk-test", fetchImpl });
  assert.equal(r.mode, "offline");
  assert.match(r.summary, /failed/);
});

test("malformed AI JSON falls back to offline", async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: "{not valid json" } }] }),
      { status: 200 }
    );
  const r = await findTools({ task: "whiteboard", pairings, apiKey: "sk-test", fetchImpl });
  assert.equal(r.mode, "offline");
  assert.ok(r.items.length > 0);
});

test("network failure falls back to offline", async () => {
  const fetchImpl = async () => {
    throw new Error("offline");
  };
  const r = await findTools({ task: "raw photo editing", pairings, apiKey: "sk-test", fetchImpl });
  assert.equal(r.mode, "offline");
  assert.ok(r.items.length > 0);
});

test("empty task short-circuits", async () => {
  const r = await findTools({ task: "   ", pairings });
  assert.deepEqual(r.items, []);
});

test("non-https baseUrl rejected (hardening) — falls back to offline", async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };
  const r = await findTools({ task: "notes", pairings, apiKey: "sk-test", baseUrl: "http://evil.example.com/v1", fetchImpl });
  assert.equal(r.mode, "offline");
  assert.equal(r.invalidBaseUrl, true, "rejection must be surfaced to the client");
  assert.match(r.summary, /base URL rejected/);
  assert.equal(called, false, "must never fetch a non-https baseUrl");

  // localhost http is allowed for dev runtimes (Ollama etc.)
  let localCalled = false;
  const localFetch = async () => {
    localCalled = true;
    throw new Error("unreachable in test");
  };
  await findTools({ task: "notes", pairings, apiKey: "k", baseUrl: "http://localhost:11434/v1", fetchImpl: localFetch });
  assert.equal(localCalled, true, "localhost http must be allowed");
});

test("localhost Ollama works without an API key", async () => {
  let fetchedHeaders = null;
  const fetchImpl = async (_url, options) => {
    fetchedHeaders = options.headers;
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "Local Ollama resolved AppFlowy.",
                items: [
                  { repo: "appflowy-io/appflowy", reason: "Local-first workspace", confidence: 0.95 },
                ],
              }),
            },
          },
        ],
      }),
      { status: 200 }
    );
  };
  const r = await findTools({
    task: "notion notes",
    pairings,
    apiKey: "",
    baseUrl: "http://localhost:11434/v1",
    fetchImpl,
  });
  assert.equal(r.mode, "ai");
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].repo, "appflowy-io/appflowy");
  assert.equal(fetchedHeaders.Authorization, undefined, "No Authorization header should be sent when apiKey is empty");
});

