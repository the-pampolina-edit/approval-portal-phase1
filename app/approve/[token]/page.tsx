'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadContent, isTokenExpired, formatDate, formatMonth, type ContentBatch, type Post } from '@/lib/content';

export default function ApprovePage() {
  const params = useParams();
  const token = params.token as string;

  const [content, setContent] = useState<ContentBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      const data = await loadContent(token);

      if (!data) {
        setError('Content not found. Please check your link.');
        setLoading(false);
        return;
      }

      if (isTokenExpired(data.expires_at)) {
        setError('This link has expired. Please contact Pampolina Edit for a new one.');
        setLoading(false);
        return;
      }

      setContent(data);
      setLoading(false);
    }

    fetchContent();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg opacity-60">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-semibold">Oops</h1>
          <p className="opacity-70">{error || 'Something went wrong.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <ConfirmationPage clientName={content.client.name} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-black/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-3">
            <h1 className="text-sm font-medium tracking-wide opacity-60">Pampolina Edit</h1>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {content.client.name}
              </h2>
              <p className="mt-2 text-lg opacity-70">
                {formatMonth(content.month, content.year)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {content.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-black/10 px-4 py-8 sm:px-6 lg:px-8 bg-black/[0.02]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          <p className="text-sm opacity-60">Ready to review?</p>
          <button
            onClick={() => {
              // Open HoneyBook link in new tab
              window.open(content.client.honeybook_url, '_blank');
              // Show confirmation after a brief delay
              setTimeout(() => setSubmitted(true), 1000);
            }}
            className="px-6 py-3 bg-[var(--color-cobalt)] text-white font-medium rounded-lg hover:opacity-90 transition"
          >
            Submit Your Approval →
          </button>
        </div>
      </footer>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <article className="space-y-4">
      {/* Asset */}
      <div className="aspect-square bg-black/5 rounded-lg overflow-hidden">
        {post.type === 'image' ? (
          <img
            src={post.asset_url}
            alt={post.caption}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : post.type === 'video' ? (
          <video
            src={post.asset_url}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        ) : null}
      </div>

      {/* Metadata & Caption */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{post.caption}</p>
            <p className="text-xs opacity-50">
              Scheduled {formatDate(post.scheduled_date)}
            </p>
          </div>
          {post.platform && (
            <div className="text-xs font-medium px-2 py-1 bg-black/10 rounded whitespace-nowrap">
              {post.platform}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ConfirmationPage({ clientName }: { clientName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <div className="text-5xl font-bold text-[var(--color-lemon)] mb-4">✓</div>
          <h1 className="text-2xl font-semibold">You're all set</h1>
          <p className="text-lg opacity-70">
            Your feedback has been sent to Pampolina Edit. We'll get started on the next steps right away.
          </p>
        </div>

        <div className="pt-6 text-sm opacity-60">
          <p>Thank you, {clientName}.</p>
        </div>
      </div>
    </div>
  );
}
