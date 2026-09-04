import test from "node:test";
import assert from "node:assert/strict";
import { generateRssFeed } from "../src/server/rss.js";

test("RSS Generator: produces valid RSS 2.0 XML with channel and items", async () => {
  const xml = await generateRssFeed({ baseUrl: "http://localhost:3000", type: "all" });

  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'));
  assert.ok(xml.includes("<title>OpenSource Hub"));
  assert.ok(xml.includes("<channel>"));
  assert.ok(xml.includes("</channel>"));
  assert.ok(xml.includes("<item>"));
  assert.ok(xml.includes("</item>"));
  assert.ok(xml.includes("<atom:link href=\"http://localhost:3000/feed.xml\""));
});

test("RSS Generator: type=releases produces release items", async () => {
  const xml = await generateRssFeed({ baseUrl: "http://localhost:3000", type: "releases" });
  assert.ok(xml.includes("<title>OpenSource Hub"));
  assert.ok(xml.includes("<rss version=\"2.0\""));
});

test("RSS Generator: type=tools produces alternative tool items", async () => {
  const xml = await generateRssFeed({ baseUrl: "http://localhost:3000", type: "tools" });
  assert.ok(xml.includes("<title>OpenSource Hub"));
  assert.ok(xml.includes("Open-Source Alternative to"));
  assert.ok(xml.includes("<item>"));
});
