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
