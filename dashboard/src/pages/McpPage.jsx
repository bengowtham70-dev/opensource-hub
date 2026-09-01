import { useState } from "react";
import { Bot, Copy, Check, Terminal, Sparkles, Cpu, Layers, ShieldCheck, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const MCP_TOOLS = [
  {
    name: "search_alternatives",
    description: "Search verified open-source alternatives to paid SaaS tools (Notion, Figma, Slack, Jira, Postman, etc.).",
    params: [
      { name: "q", type: "string", desc: "Paid tool name or query keyword (e.g., 'Notion', 'Postman')" },
      { name: "platform", type: "string", desc: "win | mac | linux | web | self-host" },
      { name: "license", type: "string", desc: "mit | agpl-3.0 | apache-2.0 | gpl-3.0" },
      { name: "goal", type: "string", desc: "replace-notion | replace-slack | etc." },
    ],
    sample: "Find a self-hosted open-source alternative to Slack with active maintenance.",
  },
  {
    name: "get_tool_details",
    description: "Retrieve comprehensive specifications, feature-parity checklist, gaps, and migration notes for a repository.",
    params: [
      { name: "repo", type: "string", desc: "Repository in owner/name format (e.g. 'usebruno/bruno')" },
    ],
    sample: "What are the feature gaps when switching from Postman to Bruno?",
  },
  {
    name: "get_trust_score",
    description: "Compute the real-time security & maintenance Trust Score (0–100), red flags, and bus-factor signals.",
    params: [
      { name: "repo", type: "string", desc: "Repository in owner/name format" },
    ],
    sample: "Check the trust score and maintenance health for 'AppFlowy-IO/AppFlowy'.",
  },
  {
    name: "audit_stack",
    description: "Audit a list of paid subscriptions, compute total annual dollar savings, and match drop-in OSS replacements.",
    params: [
      { name: "tools", type: "string", desc: "Comma or newline-separated paid tool names" },
    ],
    sample: "Audit my team's stack: Notion, Postman, Slack, Figma, Jira, Datadog.",
  },
  {
    name: "get_trending",
    description: "Query top-velocity and rising open-source repositories across today, yesterday, or all-time.",
    params: [
      { name: "view", type: "string", desc: "today | yesterday | least | all-time" },
    ],
    sample: "Show me today's fastest-trending open source projects.",
  },
  {
    name: "list_categories",
    description: "List all software categories (Productivity, DevTools, Design, etc.) with tool counts and active pairings.",
    params: [],
    sample: "What open-source categories and developer tools are cataloged?",
  },
];

export default function McpPage() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState("claude");

  const copyToClipboard = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        "opensource-hub": {
          command: "npx",
          args: ["-y", "opensource-hub", "--mcp"],
        },
      },
    },
    null,
    2
  );

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        "opensource-hub": {
          command: "npx",
          args: ["-y", "opensource-hub", "--mcp"],
        },
      },
    },
    null,
    2
  );

  const terminalCommand = "npx -y opensource-hub --mcp";

  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-10 space-y-10">
      {/* Header */}
      <header className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs">
          <Bot size={13} className="text-accent" />
          <span>Model Context Protocol (MCP)</span>
        </div>
        <h1 className="font-display text-display-lg text-ink">
          Connect OpenSource Hub to AI Agents
        </h1>
        <p className="text-sm md:text-base text-dim leading-relaxed">
          Expose our verified catalog, Trust Scores, feature-parity matrices, and stack audits to <strong>Claude Code</strong>, <strong>Claude Desktop</strong>, <strong>Cursor</strong>, and <strong>Windsurf</strong> via the Model Context Protocol.
        </p>
      </header>

      {/* Configuration Hub */}
      <section className="card-elevated p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-accent" />
            <h2 className="font-display text-lg font-semibold text-ink">
              1-Click Setup Configuration
            </h2>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-line bg-elevated/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("claude")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "claude" ? "bg-surface text-ink shadow-2xs font-semibold" : "text-dim hover:text-ink"
              }`}
            >
              Claude Desktop
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cursor")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "cursor" ? "bg-surface text-ink shadow-2xs font-semibold" : "text-dim hover:text-ink"
              }`}
            >
              Cursor IDE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cli")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "cli" ? "bg-surface text-ink shadow-2xs font-semibold" : "text-dim hover:text-ink"
              }`}
            >
              CLI / Stdio
            </button>
          </div>
        </div>

        {activeTab === "claude" && (
          <div className="space-y-3">
            <p className="text-xs text-dim">
              Add this to your Claude Desktop configuration file (<code>claude_desktop_config.json</code>):
            </p>
            <div className="relative">
              <pre className="p-4 rounded-xl border border-line bg-base text-ink text-xs font-mono overflow-x-auto leading-relaxed">
                {claudeConfig}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard("claude", claudeConfig)}
                className="btn-tactile absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-dim hover:text-ink shadow-2xs"
              >
                {copiedKey === "claude" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                <span>{copiedKey === "claude" ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "cursor" && (
          <div className="space-y-3">
            <p className="text-xs text-dim">
              Add this under Cursor Settings → Features → MCP or in your project's <code>.cursor/mcp.json</code>:
            </p>
            <div className="relative">
              <pre className="p-4 rounded-xl border border-line bg-base text-ink text-xs font-mono overflow-x-auto leading-relaxed">
                {cursorConfig}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard("cursor", cursorConfig)}
                className="btn-tactile absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-dim hover:text-ink shadow-2xs"
              >
                {copiedKey === "cursor" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                <span>{copiedKey === "cursor" ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "cli" && (
          <div className="space-y-3">
            <p className="text-xs text-dim">
              Launch the MCP server directly over standard I/O for custom agents or scripts:
            </p>
            <div className="relative">
              <pre className="p-4 rounded-xl border border-line bg-base text-ink text-xs font-mono overflow-x-auto leading-relaxed">
                {terminalCommand}
              </pre>
              <button
                type="button"
                onClick={() => copyToClipboard("cli", terminalCommand)}
                className="btn-tactile absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-medium text-dim hover:text-ink shadow-2xs"
              >
                {copiedKey === "cli" ? <Check size={13} className="text-trust" /> : <Copy size={13} />}
                <span>{copiedKey === "cli" ? "Copied" : "Copy Command"}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Tools Directory */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-ink">
            Available MCP Tools ({MCP_TOOLS.length})
          </h2>
        </div>
        <p className="text-xs text-dim -mt-2">
          These tools run entirely locally on your machine with zero cloud dependency and zero central API keys.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MCP_TOOLS.map((tool) => (
            <div key={tool.name} className="card-elevated p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-bold text-accent px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                    {tool.name}
                  </code>
                  <span className="text-[11px] text-faint">Local stdio</span>
                </div>
                <p className="text-xs text-dim leading-relaxed">
                  {tool.description}
                </p>
                {tool.params.length > 0 && (
                  <div className="pt-2 border-t border-line/60 space-y-1">
                    <span className="text-[11px] font-semibold text-faint uppercase">Parameters:</span>
                    <ul className="space-y-1 text-[11px] text-dim">
                      {tool.params.map((param) => (
                        <li key={param.name} className="flex items-baseline gap-1.5">
                          <strong className="text-ink font-mono">{param.name}</strong>
                          <span className="text-faint">({param.type}):</span>
                          <span className="truncate">{param.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-base border border-line text-[11.5px] text-faint italic flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent shrink-0" />
                <span>Example: "{tool.sample}"</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Value Proposition Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="card-elevated p-5 space-y-2">
          <ShieldCheck size={20} className="text-trust" />
          <h3 className="font-semibold text-sm text-ink">Zero API Leaks</h3>
          <p className="text-xs text-dim leading-relaxed">
            Runs offline with local caching and direct GitHub ETag lookups. Your architecture queries stay private.
          </p>
        </div>
        <div className="card-elevated p-5 space-y-2">
          <Sparkles size={20} className="text-accent" />
          <h3 className="font-semibold text-sm text-ink">Autonomous Tool Discovery</h3>
          <p className="text-xs text-dim leading-relaxed">
            Enables agents like Claude Code to automatically recommend self-hostable open-source components during coding tasks.
          </p>
        </div>
        <div className="card-elevated p-5 space-y-2">
          <Terminal size={20} className="text-tech" />
          <h3 className="font-semibold text-sm text-ink">Standard Spec (2026)</h3>
          <p className="text-xs text-dim leading-relaxed">
            Strictly implements the Model Context Protocol standard with full input validation via Zod schemas.
          </p>
        </div>
      </section>
    </div>
  );
}
