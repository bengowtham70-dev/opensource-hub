import { useEffect, useRef } from "react";
import { GISCUS } from "../lib/giscus";

export default function GiscusComments({ term }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!GISCUS.repo || !ref.current) return;
    const isDark = document.documentElement.classList.contains("dark");
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    const mapping = {
      "data-repo": GISCUS.repo,
      "data-repo-id": GISCUS.repoId,
      "data-category": GISCUS.category,
      "data-category-id": GISCUS.categoryId,
      "data-mapping": "specific",
      "data-term": `repo:${term}`,
      "data-strict": "0",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-theme": isDark ? "noborder_dark" : "noborder_light",
      "data-lang": "en",
    };
    for (const [k, v] of Object.entries(mapping)) script.setAttribute(k, v);
    ref.current.appendChild(script);

    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.classList.contains("dark");
      const iframe = ref.current?.querySelector("iframe.giscus-frame");
      if (iframe) {
        iframe.contentWindow?.postMessage(
          { giscus: { setConfig: { theme: darkNow ? "noborder_dark" : "noborder_light" } } },
          "https://giscus.app"
        );
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [term]);

  return (
    <section aria-label="Community discussion" className="mt-10">
      <h2 className="font-display text-display-md text-ink mb-4">Discussion</h2>
      {GISCUS.repo ? (
        <div ref={ref} className="card-elevated p-4" />
      ) : (
        <div className="card-elevated p-6 text-sm text-dim">
          <p>
            Community comments run on <span className="text-ink">GitHub Discussions</span> — sign in with your GitHub
            account to comment or drop a reaction.
          </p>
          <p className="mt-2 text-faint">
            (Widget activates once the listing's Discussion category is configured in{" "}
            <code className="tnum text-tech">dashboard/src/lib/giscus.js</code>.)
          </p>
        </div>
      )}
    </section>
  );
}
