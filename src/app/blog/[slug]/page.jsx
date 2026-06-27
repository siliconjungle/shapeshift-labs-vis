import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { ShapeshiftHero } from '../../page';
import PostInteractivePlaceholder from '../../../components/PostInteractivePlaceholder';
import TimeAgo, { formatTimeLabel } from '../../../components/TimeAgo';
import { postComponents } from '../../../content/posts/components';
import { getPostBySlug, posts } from '../../../content/posts/posts';

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.flatMap((post) => [
    { slug: post.slug },
    ...(post.aliases || []).map((slug) => ({ slug })),
  ]);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post not found | SHAPESHIFT LABS',
    };
  }

  return {
    title: `${post.title} | SHAPESHIFT LABS`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const PostBody = post ? postComponents[post.slug] || postComponents[slug] : null;
  const timeLabel = post ? formatTimeLabel(post.publishedAt) : '';

  if (!post || !PostBody) {
    notFound();
  }

  return (
    <ShapeshiftHero>
      <main className="blog-page">
        <article>
          <header className="content-section blog-post-header">
            <Link className="blog-back-link" href="/">
              <FiArrowLeft size={20} aria-hidden="true" />
              <span>Back to homepage</span>
            </Link>
            <div className="blog-title-row">
              <h1>{post.title}</h1>
            </div>
            <p className="blog-meta">
              <TimeAgo date={post.publishedAt} label={timeLabel} />
            </p>
          </header>

          {post.graphType ? <PostInteractivePlaceholder type={post.graphType} /> : null}

          <section className="content-section blog-body">
            <PostBody />
          </section>
        </article>
      </main>
    </ShapeshiftHero>
  );
}
