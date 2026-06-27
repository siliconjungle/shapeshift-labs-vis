'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sortPostsByMostRecent } from '../content/posts/posts';
import TimeAgo, { formatTimeLabel } from './TimeAgo';

export default function ProgressivePostList({ posts }) {
  const sortedPosts = useMemo(() => sortPostsByMostRecent(posts), [posts]);
  const itemRefs = useRef(new Map());
  const timers = useRef([]);
  const [loadedSlugs, setLoadedSlugs] = useState(
    () => new Set(sortedPosts.slice(0, 1).map((post) => post.slug))
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (!('IntersectionObserver' in window)) {
      const frame = window.requestAnimationFrame(() => {
        setLoadedSlugs(new Set(sortedPosts.map((post) => post.slug)));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const slug = entry.target.getAttribute('data-slug');
          const index = Number(entry.target.getAttribute('data-index') || 0);
          if (!slug) return;

          const timer = window.setTimeout(() => {
            setLoadedSlugs((current) => {
              if (current.has(slug)) return current;
              const next = new Set(current);
              next.add(slug);
              return next;
            });
          }, 180 + index * 90);

          timers.current.push(timer);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '160px 0px',
        threshold: 0.14,
      }
    );

    itemRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, [sortedPosts]);

  const setItemRef = (slug) => (node) => {
    if (node) {
      itemRefs.current.set(slug, node);
    } else {
      itemRefs.current.delete(slug);
    }
  };

  return (
    <div className="post-teaser-list" aria-label="Writing">
      {sortedPosts.map((post, index) => {
        const isLoaded = loadedSlugs.has(post.slug);

        return (
          <article
            className={`content-section post-teaser ${isLoaded ? 'is-loaded' : 'is-loading'}`}
            data-index={index}
            data-slug={post.slug}
            key={post.slug}
            ref={setItemRef(post.slug)}
          >
            <div className="post-teaser__skeleton" aria-hidden="true">
              <span className="post-teaser__skeleton-date" />
              <span className="post-teaser__skeleton-title" />
              <span className="post-teaser__skeleton-line" />
              <span className="post-teaser__skeleton-line post-teaser__skeleton-line--short" />
            </div>

            <Link className="post-teaser__link" href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <span className="post-teaser__footer">
                <span className="post-teaser__read">Read post</span>
                <span className="post-teaser__meta">
                  <TimeAgo
                    date={post.publishedAt}
                    label={post.timeLabel || formatTimeLabel(post.publishedAt)}
                  />
                </span>
              </span>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
