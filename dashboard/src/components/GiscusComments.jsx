import { useEffect, useRef } from "react";
import { GISCUS } from "../lib/giscus";

export default function GiscusComments({ term }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!GISCUS.repo || !ref.current) return;
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
      "data-theme": "noborder_dark",
      "data-lang": "en",
    };
    for (const [k, v] of Object.entries(mapping)) script.setAttribute(k, v);
    ref.current.appendChild(script);
    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [term]);

  return (
    <section aria-label="Community discussion" className="mt-10">
      <h2 className="font-display text-display-md text-ink mb-4">Discussion</h2>
      {GISCUS.repo ? (
        <div ref={ref} className="card-glass p-4" />
      ) : (
        <div className="card-glass p-6 text-sm text-dim">
          <p>
            Community comments run on <span className="text-ink">GitHub Discussions</span> — sign in with your GitHub
            account to comment or drop a 👍.
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
