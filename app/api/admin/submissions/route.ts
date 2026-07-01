import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const batchId = request.nextUrl.searchParams.get('batchId');
    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('batch_id', batchId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
