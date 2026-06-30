import { NextRequest, NextResponse } from 'next/server';
import { createPost, getPostsByBatch, updatePost } from '@/lib/admin-db';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const batchId = request.nextUrl.searchParams.get('batchId');
    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const posts = await getPostsByBatch(batchId);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const batchId = formData.get('batchId') as string;
    const caption = formData.get('caption') as string;
    const scheduledDate = formData.get('scheduledDate') as string;
    const platform = formData.get('platform') as string;
    const file = formData.get('file') as File;

    if (!batchId || !caption || !scheduledDate || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filePath = `${batchId}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('approval-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('approval-assets')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Create post record
    const post = await createPost(batchId, imageUrl, caption, scheduledDate, platform || undefined);

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, caption, scheduledDate, platform } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 });
    }

    const post = await updatePost(postId, caption, scheduledDate, platform);
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
