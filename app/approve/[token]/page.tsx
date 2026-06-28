'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadContent, isTokenExpired, formatDate, formatMonth, type ContentBatch, type Post } from '@/lib/content';

type PostApproval = {
  id: string;
  status: 'pending' | 'approved' | 'edit_requested';
  edit_note: string;
};

export default function ApprovePage() {
  const params = useParams();
  const token = params.token as string;

  const [content, setContent] = useState<ContentBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvals, setApprovals] = useState<Record<string, PostApproval>>({});

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

      // Initialize approvals object
      const initialApprovals: Record<string, PostApproval> = {};
      data.posts.forEach(post => {
        initialApprovals[post.id] = {
          id: post.id,
          status: 'pending',
          edit_note: '',
        };
      });
      setApprovals(initialApprovals);

      setLoading(false);
    }

    fetchContent();
  }, [token]);

  function updateApproval(postId: string, status: 'approved' | 'edit_requested', note?: string) {
    setApprovals(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        status,
        edit_note: note ?? '',
      },
    }));
  }

  async function handleSubmit() {
    if (!content) return;

    // Check all posts are actioned
    const allActioned = Object.values(approvals).every(a => a.status !== 'pending');
    if (!allActioned) {
      alert('Please review all posts before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('Zapier webhook URL not configured');
      }

      // Build payload
      const payload = {
        client_name: content.client.name,
        month: formatMonth(content.month, content.year),
        submitted_at: new Date().toISOString(),
        posts: content.posts.map(post => ({
          asset_filename: post.asset_url.split('/').pop() || post.asset_url,
          caption: post.caption,
          scheduled_date: post.scheduled_date,
          status: approvals[post.id].status,
          edit_note: approvals[post.id].edit_note || null,
        })),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  }

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

  const allActioned = Object.values(approvals).every(a => a.status !== 'pending');

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
              <PostCard
                key={post.id}
                post={post}
                approval={approvals[post.id]}
                onApprove={() => updateApproval(post.id, 'approved')}
                onRequestEdit={() => updateApproval(post.id, 'edit_requested')}
                onEditNoteChange={(note) => updateApproval(post.id, 'edit_requested', note)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 px-4 py-8 sm:px-6 lg:px-8 bg-black/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={!allActioned || submitting}
              className={`px-6 py-3 font-medium rounded-lg transition ${
                allActioned && !submitting
                  ? 'bg-[var(--color-cobalt)] text-white hover:opacity-90 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Your Approval →'}
            </button>
            <p className="text-sm opacity-60">
              {Object.values(approvals).filter(a => a.status !== 'pending').length} of{' '}
              {Object.values(approvals).length} reviewed
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PostCard({
  post,
  approval,
  onApprove,
  onRequestEdit,
  onEditNoteChange,
}: {
  post: Post;
  approval: PostApproval;
  onApprove: () => void;
  onRequestEdit: () => void;
  onEditNoteChange: (note: string) => void;
}) {
  return (
    <article className="space-y-4 p-6 border border-black/10 rounded-lg">
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

      {/* Content */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">{post.caption}</p>
          <p className="text-xs opacity-50">Scheduled {formatDate(post.scheduled_date)}</p>
        </div>

        {post.platform && (
          <div className="text-xs font-medium px-2 py-1 bg-black/10 rounded w-fit">
            {post.platform}
          </div>
        )}

        {/* Approval Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onApprove}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition ${
              approval.status === 'approved'
                ? 'bg-green-500 text-white'
                : 'border border-green-500 text-green-600 hover:bg-green-50'
            }`}
          >
            ✓ Approve
          </button>
          <button
            onClick={onRequestEdit}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition ${
              approval.status === 'edit_requested'
                ? 'bg-yellow-500 text-white'
                : 'border border-yellow-500 text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            ✗ Edit
          </button>
        </div>

        {/* Edit Note */}
        {approval.status === 'edit_requested' && (
          <div>
            <label className="text-xs opacity-60 block mb-2">Your feedback:</label>
            <textarea
              value={approval.edit_note}
              onChange={(e) => onEditNoteChange(e.target.value)}
              placeholder="What should we change?"
              className="w-full px-3 py-2 border border-black/10 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-cobalt)] resize-none"
              rows={2}
            />
          </div>
        )}
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
