import { useState, useMemo } from "react";
import { Container, Copy, Check, Download, Terminal, Settings } from "lucide-react";

export function generateDockerCompose(repo, alternative = {}) {
  const repoName = (repo ? repo.split("/")[1] : "app") || "app";
  const orgName = (repo ? repo.split("/")[0] : "library") || "library";
  const image = alternative.dockerImage || `${orgName}/${repoName}:latest`;
  const port = alternative.defaultPort || 8080;
  const containerName = repoName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  return `version: '3.8'

services:
  ${containerName}:
    image: ${image}
    container_name: ${containerName}
    restart: unless-stopped
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
      - PORT=${port}
      - APP_URL=http://localhost:${port}
    volumes:
      - ${containerName}_data:/var/lib/${containerName}/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${port}/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ${containerName}_data:
    driver: local
`;
}

export default function DockerComposeViewer({ repo, alternative = {} }) {
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const composeYaml = useMemo(
    () => generateDockerCompose(repo, alternative),
    [repo, alternative]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(composeYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(`docker compose up -d`);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([composeYaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `docker-compose.${repo ? repo.split("/")[1] : "app"}.yml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card-elevated p-6 mt-6 relative overflow-hidden" aria-label="1-Click Docker Compose Generator">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center size-8 rounded-lg bg-ink text-surface dark:bg-surface dark:text-ink">
              <Container size={16} className="text-accent" />
            </span>
            <h2 className="font-display text-display-md text-ink">1-Click Docker Compose</h2>
          </div>
          <p className="text-[12.5px] text-faint mt-1">
            Production-ready container configuration with persistent storage and healthchecks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-dim hover:text-ink text-[12.5px] font-medium"
            title="Download docker-compose.yml"
          >
            <Download size={13} className="text-faint" />
            <span>Download .yml</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/20 bg-primary text-surface text-[12.5px] font-semibold shadow-xs"
            title="Copy Docker Compose YAML"
          >
            {copied ? (
              <>
                <Check size={13} className="text-trust" />
                <span className="text-trust">Copied YAML!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy YAML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Quick Launch Box */}
      <div className="mb-3.5 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-line bg-elevated text-dim font-mono text-[12px]">
        <div className="flex items-center gap-2 truncate">
          <Terminal size={14} className="text-ember shrink-0" />
          <span className="text-faint select-none">$</span>
          <span className="text-ink truncate select-all">docker compose up -d</span>
        </div>
        <button
          type="button"
          onClick={handleCopyCmd}
          className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-line hover:border-line-strong text-[11px] text-faint hover:text-ink shrink-0"
        >
          {copiedCmd ? <Check size={11} className="text-trust" /> : <Copy size={11} />}
          {copiedCmd ? "Copied" : "Copy Command"}
        </button>
      </div>

      {/* YAML Preview Container */}
      <div className="relative rounded-xl border border-line-strong/60 bg-canvas p-4 overflow-x-auto text-[12.5px] leading-relaxed text-dim font-mono">
        <pre className="select-text whitespace-pre overflow-x-auto">{composeYaml}</pre>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-faint">
        <Settings size={12} className="text-faint shrink-0" />
        <span>Customize ports, data volumes, or database passwords in your local <code>.env</code> file.</span>
      </div>
    </section>
  );
}
