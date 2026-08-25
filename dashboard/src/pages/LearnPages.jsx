import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import Markdown from "../lib/markdown";
import { GridSkeleton } from "../components/states";

export function LearnListPage() {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    api.learnList().then(setArticles).catch(() => setArticles([]));
  }, []);

  return (
    <div className="mx-auto max-w-[900px] px-4 md:px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-display-lg flex items-center gap-3">
          <BookOpen className="text-trust" size={30} /> Learn
        </h1>
        <p className="text-dim mt-2 max-w-[60ch]">
          Plain-language primers on open source, GitHub, licenses and installs — no jargon, five-minute reads.
        </p>
      </header>

      {!articles && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {articles &&
          articles.map((a, i) => (
            <Link
              key={a.slug}
              to={`/learn/${a.slug}`}
              className="card-glass p-5 flex items-center gap-4 group animate-card-in"
              style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}
            >
              <span className="tnum text-faint text-sm">{String(a.order).padStart(2, "0")}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-display text-lg text-ink group-hover:text-primary transition-colors">
                  {a.title}
                </span>
                {a.description && <span className="block text-sm text-faint mt-0.5 truncate">{a.description}</span>}
              </span>
              <ArrowRight size={16} className="text-faint group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
      </div>
    </div>
  );
}

export function LearnArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setArticle(null);
    api.learnArticle(slug).then(setArticle).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (error)
    return (
      <div className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <p className="text-caution tnum text-sm mb-4">⚠ {error}</p>
        <Link to="/learn" className="shimmer-button btn-tactile inline-flex px-4 py-2 text-sm text-ink">
          Back to Learn
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-[760px] px-4 md:px-6 py-10">
      <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile">
        <ArrowLeft size={15} /> All articles
      </Link>

      {!article ? (
        <div className="mt-6 space-y-3">
          <div className="skeleton h-10 w-2/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      ) : (
        <article className="mt-6 animate-card-in opacity-0">
          {/* Article header is rendered by markdown's H1; description as lede */}
          {article.description && <p className="text-dim italic -mt-2 mb-6">{article.description}</p>}
          <Markdown source={article.body} />
        </article>
      )}
    </div>
  );
}
