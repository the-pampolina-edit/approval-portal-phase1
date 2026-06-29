'use client';

import { useEffect, useState } from 'react';
import type { Batch, Post } from '@/lib/supabase';
import { generateMagicLinkUrl } from '@/lib/admin-auth';

export default function AdminPage() {
  const [batches, setBatches] = useState<(Batch & { post_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  // Form states
  const [batchForm, setBatchForm] = useState({
    clientName: '',
    honeybook_url: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [postForm, setPostForm] = useState({
    caption: '',
    scheduledDate: '',
    platform: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchPosts(selectedBatch);
    }
  }, [selectedBatch]);

  async function fetchBatches() {
    try {
      const response = await fetch('/api/admin/batches');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPosts(batchId: string) {
    try {
      const response = await fetch(`/api/admin/posts?batchId=${batchId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  }

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchForm),
      });
      if (!response.ok) throw new Error('Failed to create');
      const newBatch = await response.json();
      setBatches([newBatch, ...batches]);
      setSelectedBatch(newBatch.id);
      setShowNewBatchForm(false);
      setBatchForm({ clientName: '', honeybook_url: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    } catch (err) {
      console.error('Error creating batch:', err);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBatch || !postForm.file) return;

    try {
      const formData = new FormData();
      formData.append('batchId', selectedBatch);
      formData.append('caption', postForm.caption);
      formData.append('scheduledDate', postForm.scheduledDate);
      formData.append('platform', postForm.platform);
      formData.append('file', postForm.file);

      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create post');
      const newPost = await response.json();
      setPosts([...posts, newPost]);
      setShowNewPostForm(false);
      setPostForm({ caption: '', scheduledDate: '', platform: '', file: null });
    } catch (err) {
      console.error('Error creating post:', err);
    }
  }

  const currentBatch = batches.find(b => b.id === selectedBatch);
  const magicLink = currentBatch ? generateMagicLinkUrl(currentBatch.magic_link_token) : '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#FFFFFF', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Admin Dashboard</h1>
          <button
            onClick={() => setShowNewBatchForm(!showNewBatchForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ecff90',
              color: '#000000',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            + New Batch
          </button>
        </div>

        {showNewBatchForm && (
          <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Create New Batch</h2>
            <form onSubmit={handleCreateBatch} style={{ display: 'grid', gap: '16px' }}>
              <input
                type="text"
                placeholder="Client Name"
                value={batchForm.clientName}
                onChange={e => setBatchForm({ ...batchForm, clientName: e.target.value })}
                required
                style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
              />
              <input
                type="url"
                placeholder="HoneyBook Smart File URL (optional)"
                value={batchForm.honeybook_url}
                onChange={e => setBatchForm({ ...batchForm, honeybook_url: e.target.value })}
                style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <select
                  value={batchForm.month}
                  onChange={e => setBatchForm({ ...batchForm, month: parseInt(e.target.value) })}
                  style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={batchForm.year}
                  onChange={e => setBatchForm({ ...batchForm, year: parseInt(e.target.value) })}
                  min="2024"
                  max="2030"
                  style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ecff90',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Create Batch
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewBatchForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#333',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Batches List */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Batches</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {batches.map(batch => (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch.id)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedBatch === batch.id ? '#ecff90' : '#1a1a1a',
                    color: '#000000',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{batch.client_name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.6 }}>
                    {new Date(batch.year, batch.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Batch Details */}
          {currentBatch && (
            <div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{currentBatch.client_name}</h2>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Magic Link:</p>
                  <input
                    type="text"
                    value={magicLink}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#0A0A0A',
                      color: '#ecff90',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <button
                  onClick={() => navigator.clipboard.writeText(magicLink)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ecff90',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginBottom: '16px',
                  }}
                >
                  Copy Link
                </button>

                <p style={{ fontSize: '12px', opacity: 0.6 }}>
                  Status: <strong>{currentBatch.status}</strong>
                </p>
                <p style={{ fontSize: '12px', opacity: 0.6 }}>
                  Expires: {new Date(currentBatch.expires_at).toLocaleDateString()}
                </p>
              </div>

              {/* Posts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Posts ({posts.length})</h3>
                <button
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ecff90',
                    color: '#000000',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  + Add Post
                </button>
              </div>

              {showNewPostForm && (
                <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
                  <form onSubmit={handleCreatePost} style={{ display: 'grid', gap: '16px' }}>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => setPostForm({ ...postForm, file: e.target.files?.[0] || null })}
                      required
                      style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
                    />
                    <textarea
                      placeholder="Caption"
                      value={postForm.caption}
                      onChange={e => setPostForm({ ...postForm, caption: e.target.value })}
                      required
                      style={{
                        padding: '12px',
                        backgroundColor: '#0A0A0A',
                        color: '#000000',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        minHeight: '80px',
                        resize: 'none',
                      }}
                    />
                    <input
                      type="date"
                      value={postForm.scheduledDate}
                      onChange={e => setPostForm({ ...postForm, scheduledDate: e.target.value })}
                      required
                      style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
                    />
                    <input
                      type="text"
                      placeholder="Platform (e.g., Instagram, Facebook)"
                      value={postForm.platform}
                      onChange={e => setPostForm({ ...postForm, platform: e.target.value })}
                      style={{ padding: '12px', backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #333', borderRadius: '6px', fontSize: '14px' }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#ecff90',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Add Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewPostForm(false)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#333',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {posts.map(post => (
                  <div key={post.id} style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', alignItems: 'start' }}>
                      <img src={post.image_url} alt={post.caption} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div>
                        <p style={{ fontSize: '14px', marginBottom: '8px' }}>{post.caption}</p>
                        <p style={{ fontSize: '12px', opacity: 0.6 }}>
                          {new Date(post.scheduled_date).toLocaleDateString()} {post.platform && `• ${post.platform}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
