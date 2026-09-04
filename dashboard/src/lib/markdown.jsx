// Minimal, injection-safe markdown renderer for our own Learn articles.
// Supports: # ## ### headings, - lists, paragraphs, **bold**, *italic*, `code`.
import React from "react";

function renderInline(text, keyBase) {
  const parts = [];
  let rest = text;
  let k = 0;
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/;
  while (rest.length) {
    const m = rest.match(pattern);
    if (!m || m.index === undefined) {
      parts.push(rest);
      break;
    }
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    if (m[1] && m[2]) {
      const isExternal = m[2].startsWith("http");
      const isRepo = m[2].includes("opensource-hub.org/repo/") || m[2].startsWith("/repo/");
      const href = isRepo ? `/repo/${m[2].replace(/^.*\/repo\//, "")}` : m[2];
      parts.push(
        <a
          key={`${keyBase}-${k}`}
          href={href}
          target={isExternal && !isRepo ? "_blank" : undefined}
          rel={isExternal && !isRepo ? "noreferrer" : undefined}
          className="text-link hover:underline font-semibold"
        >
          {m[1]}
        </a>
      );
    } else if (m[3]) parts.push(<strong key={`${keyBase}-${k}`} className="text-ink font-semibold">{m[3]}</strong>);
    else if (m[4]) parts.push(<em key={`${keyBase}-${k}`}>{m[4]}</em>);
    else if (m[5])
      parts.push(
        <code key={`${keyBase}-${k}`} className="tnum text-[0.85em] px-1 py-0.5 rounded bg-elevated border border-line text-tech">
          {m[5]}
        </code>
      );
    rest = rest.slice(m.index + m[0].length);
    k += 1;
  }
  return parts;
}

export default function Markdown({ source, content, children }) {
  const text = source || content || (typeof children === "string" ? children : "") || "";
  const blocks = [];
  const lines = text.split("\n");
  let list = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-6 space-y-1.5 my-4 text-dim">
          {list.map((item, i) => (
            <li key={i} className="leading-relaxed">{renderInline(item, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^- /.test(line)) {
      list.push(line.slice(2));
      return;
    }
    flushList();
    if (!line.trim()) return;
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={idx} className="font-display text-lg font-semibold text-ink mt-6 mb-2">
          {renderInline(line.slice(4), `h3-${idx}`)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={idx} className="font-display text-display-md text-ink mt-8 mb-3">
          {renderInline(line.slice(3), `h2-${idx}`)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={idx} className="font-display text-display-lg text-ink mb-4">
          {renderInline(line.slice(2), `h1-${idx}`)}
        </h1>
      );
    } else {
      blocks.push(
        <p key={idx} className="text-dim leading-relaxed my-3 max-w-[68ch]">
          {renderInline(line, `p-${idx}`)}
        </p>
      );
    }
  });
  flushList();

  return <div>{blocks}</div>;
}
