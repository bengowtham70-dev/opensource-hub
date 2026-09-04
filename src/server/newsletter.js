import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

function getSubscribersFile(dir = getUserDataDir()) {
  return path.join(dir, "subscribers.json");
}

export function createNewsletterStore({ dir = getUserDataDir() } = {}) {
  const file = getSubscribersFile(dir);

  function read() {
    try {
      if (fs.existsSync(file)) {
        const raw = JSON.parse(fs.readFileSync(file, "utf8"));
        if (Array.isArray(raw.subscribers)) return raw;
      }
    } catch {
      /* first run */
    }
    return { subscribers: [] };
  }

  function write(data) {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch {
      /* silent */
    }
  }

  return {
    subscribe(email, source = "footer") {
      const cleanEmail = String(email || "").trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error("Please provide a valid email address.");
      }

      const data = read();
      const existing = data.subscribers.find((s) => s.email === cleanEmail);
      if (existing) {
        return { ok: true, message: "You are already subscribed to weekly updates!", email: cleanEmail };
      }

      const entry = {
        email: cleanEmail,
        subscribedAt: new Date().toISOString(),
        source: String(source || "footer"),
      };

      data.subscribers.unshift(entry);
      write(data);

      return { ok: true, message: "Subscribed successfully! Welcome to OpenSource Hub Weekly.", email: cleanEmail };
    },

    list() {
      return read().subscribers;
    },

    toCsv() {
      const list = read().subscribers;
      const header = "Email,SubscribedAt,Source\r\n";
      const rows = list
        .map((s) => `"${s.email.replace(/"/g, '""')}","${s.subscribedAt}","${s.source}"`)
        .join("\r\n");
      return header + rows;
    },
  };
}

export function getNewsletterIssues(contentDir) {
  const dir = contentDir || path.resolve(process.cwd(), "content", "newsletter");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const issues = [];

  for (const file of files) {
    try {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const id = file.replace(/\.md$/, "");
      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      let title = id;
      let date = "";
      let week = id;
      let content = raw;

      if (fmMatch) {
        const fm = fmMatch[1];
        content = fmMatch[2];
        const titleMatch = fm.match(/title:\s*["']?([^"'\n]+)["']?/);
        const dateMatch = fm.match(/date:\s*["']?([^"'\n]+)["']?/);
        const weekMatch = fm.match(/week:\s*["']?([^"'\n]+)["']?/);
        if (titleMatch) title = titleMatch[1];
        if (dateMatch) date = dateMatch[1];
        if (weekMatch) week = weekMatch[1];
      }

      const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
      const snippet = lines.slice(0, 2).join(" ");

      issues.push({
        id,
        title,
        date,
        week,
        snippet,
        fileName: file,
      });
    } catch {
      /* skip invalid file */
    }
  }

  issues.sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id));
  return issues;
}

export function getNewsletterIssueById(id, contentDir) {
  const dir = contentDir || path.resolve(process.cwd(), "content", "newsletter");
  const cleanId = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = path.join(dir, `${cleanId}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  let title = cleanId;
  let date = "";
  let week = cleanId;
  let content = raw;

  if (fmMatch) {
    const fm = fmMatch[1];
    content = fmMatch[2];
    const titleMatch = fm.match(/title:\s*["']?([^"'\n]+)["']?/);
    const dateMatch = fm.match(/date:\s*["']?([^"'\n]+)["']?/);
    const weekMatch = fm.match(/week:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) title = titleMatch[1];
    if (dateMatch) date = dateMatch[1];
    if (weekMatch) week = weekMatch[1];
  }

  return {
    id: cleanId,
    title,
    date,
    week,
    markdown: content,
  };
}

