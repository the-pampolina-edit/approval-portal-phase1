import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', anonKey || '');
export const supabaseAdmin = createClient(supabaseUrl || '', serviceRoleKey || '');

export type Batch = {
  id: string;
  month: number;
  year: number;
  client_name: string;
  honeybook_url: string;
  magic_link_token: string;
  expires_at: string;
  status: 'pending' | 'partially_reviewed' | 'approved' | 'needs_edits';
  submitted_at: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  batch_id: string;
  image_url: string;
  caption: string;
  scheduled_date: string;
  platform: string | null;
  status: 'pending' | 'approved' | 'edit_requested';
  edit_note: string | null;
  created_at: string;
};