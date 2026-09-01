import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Newspaper, ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { api } from "../lib/api";
import Markdown from "../lib/markdown";

export function BlogListPage() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    api.blogList().then(setPosts).catch(() => setPosts([]));
  }, []);

  return (
    <div className="mx-auto max-w-[900px] px-4 md:px-6 py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-surface text-xs font-medium text-dim shadow-2xs mb-3">
          <Newspaper size={13} className="text-accent" />
          <span>Editorial & Guides</span>
        </div>
        <h1 className="font-display text-display-lg text-ink">
          OpenSource Hub Blog
        </h1>
        <p className="text-dim mt-2 max-w-[60ch] leading-relaxed">
          Deep-dives, migration guides, trust score methodologies, and curated open source replacement roundups.
        </p>
      </header>

      {!posts && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && (
        <div className="p-8 text-center border border-line rounded-2xl bg-surface">
          <p className="text-dim text-sm">No blog posts available yet.</p>
        </div>
      )}

      <div className="grid gap-4">
        {posts &&
          posts.map((p, i) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="card-elevated p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group animate-card-in"
              style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3 text-xs text-faint">
                  {p.date && (
                    <span className="inline-flex items-center gap-1 tnum">
                      <Calendar size={12} /> {p.date}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> ~4 min read
                  </span>
                </div>
                <h2 className="font-display text-xl font-semibold text-ink group-hover:text-link transition-colors">
                  {p.title}
                </h2>
                {p.description && (
                  <p className="text-sm text-dim leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-link shrink-0">
                <span>Read article</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPost(null);
    api.blogPost(slug).then(setPost).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <p className="text-caution tnum text-sm mb-4">{error}</p>
        <Link to="/blog" className="shimmer-button btn-tactile inline-flex px-4 py-2 text-sm text-ink">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 md:px-6 py-10">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-ink btn-tactile mb-6">
        <ArrowLeft size={15} /> All articles
      </Link>

      {!post ? (
        <div className="space-y-4">
          <div className="skeleton h-10 w-3/4 rounded-xl" />
          <div className="skeleton h-4 w-1/3 rounded-lg" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-2/3 rounded-lg" />
        </div>
      ) : (
        <article className="animate-card-in">
          <header className="border-b border-line pb-6 mb-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-faint">
              {post.date && (
                <span className="inline-flex items-center gap-1 tnum">
                  <Calendar size={13} /> {post.date}
                </span>
              )}
              <span>·</span>
              <span>OpenSource Hub Editorial</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-base text-dim leading-relaxed font-serif italic">
                {post.description}
              </p>
            )}
          </header>
          <div className="prose prose-neutral dark:prose-invert max-w-none text-ink leading-relaxed">
            <Markdown source={post.body} />
          </div>
        </article>
      )}
    </div>
  );
}
