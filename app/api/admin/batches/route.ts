import { NextRequest, NextResponse } from 'next/server';
import { getAllBatches, createBatch, getPostsByBatch } from '@/lib/admin-db';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const batches = await getAllBatches();
    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientName, clientEmail, honeybook_url, month, year } = await request.json();

    if (!clientName || !month || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const batch = await createBatch(clientName, honeybook_url || '', month, year, clientEmail || undefined);
    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}
