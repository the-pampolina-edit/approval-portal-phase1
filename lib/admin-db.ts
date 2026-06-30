import { supabaseAdmin, supabase } from './supabase';
import type { Batch, Post } from './supabase';
import { generateMagicToken } from './admin-auth';

// BATCHES
export async function getAllBatches() {
  const { data, error } = await supabaseAdmin
    .from('batches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Batch[];
}

export async function getBatch(id: string) {
  const { data, error } = await supabaseAdmin
    .from('batches')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Batch;
}

export async function createBatch(
  clientName: string,
  honeybook_url: string,
  month: number,
  year: number,
  expiryDays: number = 5
) {
  const token = generateMagicToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from('batches')
    .insert({
      client_name: clientName,
      honeybook_url,
      month,
      year,
      magic_link_token: token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Batch;
}

// POSTS
export async function getPostsByBatch(batchId: string) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('batch_id', batchId)
    .order('scheduled_date');
  if (error) throw error;
  return data as Post[];
}

export async function createPost(
  batchId: string,
  imageUrl: string,
  caption: string,
  scheduledDate: string,
  platform?: string
) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      batch_id: batchId,
      image_url: imageUrl,
      caption,
      scheduled_date: scheduledDate,
      platform: platform || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function updatePost(
  id: string,
  caption?: string,
  scheduledDate?: string,
  platform?: string | null
) {
  const updates: Record<string, any> = {};
  if (caption !== undefined) updates.caption = caption;
  if (scheduledDate !== undefined) updates.scheduled_date = scheduledDate;
  if (platform !== undefined) updates.platform = platform;

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string) {
  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Get batch by token for client
export async function getBatchByToken(token: string) {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('magic_link_token', token)
    .single();
  if (error) throw error;
  return data as Batch;
}

// Compute and update batch status
export async function computeAndUpdateBatchStatus(batchId: string) {
  const posts = await getPostsByBatch(batchId);

  if (posts.length === 0) {
    await supabaseAdmin.from('batches').update({ status: 'pending' }).eq('id', batchId);
    return 'pending';
  }

  const hasEditsRequested = posts.some(p => p.status === 'edit_requested');
  const allApproved = posts.every(p => p.status === 'approved');
  const allActioned = posts.every(p => p.status !== 'pending');

  let status: Batch['status'] = 'pending';
  if (hasEditsRequested) status = 'needs_edits';
  else if (allApproved) status = 'approved';
  else if (allActioned) status = 'approved';
  else status = 'partially_reviewed';

  await supabaseAdmin.from('batches').update({ status }).eq('id', batchId);
  return status;
}
