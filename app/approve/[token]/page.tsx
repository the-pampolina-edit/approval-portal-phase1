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

      // Get month name
      const monthDate = new Date(content.year, content.month - 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

      // Build payload
      const payload = {
        client_name: content.client_name,
        month: monthName,
        year: content.year,
        submitted_at: new Date().toISOString(),
        posts: content.posts.map(post => ({
          id: post.id,
          caption: post.caption,
          scheduled_date: post.scheduled_date,
          platform: post.platform || null,
          status: approvals[post.id].status,
          edit_note: approvals[post.id].edit_note || null,
        })),
      };

      // POST to Zapier webhook
      const zapierResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!zapierResponse.ok) {
        console.warn('Zapier webhook failed, but continuing with Supabase logging');
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
        <p style={{ color: 'var(--color-muted-text)' }}>Loading...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 md:px-10">
        <div style={{ maxWidth: '500px', textAlign: 'center' }} className="space-y-4">
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Oops</h1>
          <p style={{ color: 'var(--color-muted-text)' }}>{error || 'Something went wrong.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <ConfirmationPage clientName={content.client_name} />;
  }

  const allActioned = Object.values(approvals).every(a => a.status !== 'pending');
  const reviewed = Object.values(approvals).filter(a => a.status !== 'pending').length;
  const total = Object.values(approvals).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header style={{ borderBottomWidth: '1px', borderBottomColor: 'var(--color-border)' }} className="px-6 md:px-10 py-8">
        <div className="container-max">
          <div className="flex justify-between items-start gap-6">
            <div>
              <h1 style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em', color: '#2563EB', marginBottom: '16px' }}>
                PAMPOLINA EDIT
              </h1>
              <h2 style={{ fontSize: '32px', fontWeight: 700 }}>
                {content.client_name}
              </h2>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--color-muted-text)' }}>
              <p style={{ fontSize: '14px' }}>{formatMonth(content.month, content.year)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-10 py-12 md:py-16">
        <div className="container-max">
          {/* Section Label */}
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-onyx)' }}>
              {formatMonth(content.month, content.year)} Content Calendar — {content.client_name}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
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

          {/* Submit Section */}
          <div style={{ textAlign: 'center', paddingTop: '24px', borderTopWidth: '1px', borderTopColor: 'var(--color-border)' }}>
            <button
              onClick={handleSubmit}
              disabled={!allActioned || submitting}
              style={{
                backgroundColor: allActioned && !submitting ? 'var(--color-cobalt)' : '#D3D3D3',
                color: 'white',
                fontSize: '16px',
                fontWeight: 500,
                padding: '16px 48px',
                borderRadius: '6px',
                cursor: allActioned && !submitting ? 'pointer' : 'not-allowed',
                opacity: allActioned && !submitting ? 1 : 0.4,
                transition: 'all 0.2s ease',
                boxShadow: allActioned && !submitting ? `0 0 20px rgba(196, 255, 0, 0.3)` : 'none',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Your Approval →'}
            </button>
            <p style={{ fontSize: '12px', color: 'var(--color-muted-text)', marginTop: '16px' }}>
              {reviewed} of {total} reviewed
            </p>
          </div>
        </div>
      </main>
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
  const isApproved = approval.status === 'approved';

  return (
    <article
      style={{
        backgroundColor: '#FFFFFF',
        borderWidth: '2px',
        borderColor: isApproved ? 'var(--color-cobalt)' : 'var(--color-border)',
        borderLeftWidth: isApproved ? '4px' : '2px',
        borderRadius: '16px',
        padding: '20px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Asset */}
      <div style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
        {post.type === 'image' ? (
          <img
            src={post.image_url}
            alt={post.caption}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            loading="lazy"
          />
        ) : post.type === 'video' ? (
          <video
            src={post.image_url}
            controls
            preload="metadata"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        ) : null}
      </div>

      {/* Content */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.6, marginBottom: '12px' }}>
          {post.caption}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-cobalt)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {formatDate(post.scheduled_date)}
          </p>
          {post.platform && (
            <span style={{ fontSize: '12px', color: 'var(--color-cobalt)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {post.platform}
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <button
          onClick={onApprove}
          style={{
            flex: 1,
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: isApproved ? 'var(--color-cobalt)' : '#FFFFFF',
            color: isApproved ? '#FFFFFF' : 'var(--color-cobalt)',
            border: isApproved ? 'none' : '2px solid var(--color-cobalt)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: isApproved ? 0.6 : 1,
          }}
        >
            ✓ Approve
        </button>
        <button
          onClick={onRequestEdit}
          style={{
            flex: 1,
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: approval.status === 'edit_requested' ? 'var(--color-onyx)' : '#FFFFFF',
            color: approval.status === 'edit_requested' ? '#FFFFFF' : 'var(--color-onyx)',
            border: approval.status === 'edit_requested' ? 'none' : `2px solid var(--color-onyx)`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          ✗ Request Edit
        </button>
      </div>

      {/* Feedback Box */}
      {approval.status === 'edit_requested' && (
        <div style={{ marginTop: '12px' }}>
          <textarea
            value={approval.edit_note}
            onChange={(e) => onEditNoteChange(e.target.value)}
            placeholder="Your feedback..."
            style={{
              width: '100%',
              padding: '12px',
              borderWidth: '4px',
              borderColor: 'var(--color-cobalt)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            rows={3}
          />
        </div>
      )}
    </article>
  );
}

function ConfirmationPage({ clientName }: { clientName: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 md:px-10">
      <div style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', fontWeight: 700, color: 'var(--color-cobalt)', marginBottom: '24px' }}>
            ✓
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>
            You're all set.
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-muted-text)', lineHeight: 1.6 }}>
            Your feedback has been sent to Pampolina Edit. We'll get started on the next steps right away.
          </p>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-muted-text)' }}>
          Thank you, {clientName}.
        </p>
      </div>
    </div>
  );
}
