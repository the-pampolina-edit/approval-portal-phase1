import { supabase } from './supabase';
import type { Batch, Post as DBPost } from './supabase';

export interface ContentBatch {
  id: string;
  client_name: string;
  honeybook_url: string;
  month: number;
  year: number;
  magic_link_token: string;
  expires_at: string;
  status: 'pending' | 'partially_reviewed' | 'approved' | 'needs_edits';
  posts: Post[];
}

export interface Post {
  id: string;
  image_url: string;
  caption: string;
  scheduled_date: string;
  platform: string | null;
  type: 'image' | 'video';
}

export async function loadContent(token: string): Promise<ContentBatch | null> {
  try {
    // Fetch batch by token
    const { data: batchData, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('magic_link_token', token)
      .single();

    if (batchError || !batchData) {
      return null;
    }

    // Fetch posts for this batch
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('batch_id', batchData.id)
      .order('scheduled_date');

    if (postsError) {
      return null;
    }

    const posts: Post[] = (postsData || []).map(p => ({
      id: p.id,
      image_url: p.image_url,
      caption: p.caption,
      scheduled_date: p.scheduled_date,
      platform: p.platform,
      type: p.image_url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
    }));

    return {
      id: batchData.id,
      client_name: batchData.client_name,
      honeybook_url: batchData.honeybook_url,
      month: batchData.month,
      year: batchData.year,
      magic_link_token: batchData.magic_link_token,
      expires_at: batchData.expires_at,
      posts,
    };
  } catch (error) {
    console.error('Failed to load content:', error);
    return null;
  }
}

export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function formatDate(dateString: string): string {
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const dateFormatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (timePart && timePart !== '00:00:00') {
    const [hours, minutes] = timePart.split(':');
    return `${dateFormatted} at ${parseInt(hours)}:${minutes}`;
  }
  return dateFormatted;
}

export function formatMonth(month: number, year: number): string {
  const monthDate = new Date(year, month - 1);
  return monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
