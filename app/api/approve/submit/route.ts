import { supabaseAdmin } from '@/lib/supabase';
import { sendSubmissionConfirmation } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { batch_id } = payload;

    const webhookUrl = process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL;
    if (!webhookUrl) {
      return Response.json(
        { error: 'Zapier webhook URL not configured' },
        { status: 500 }
      );
    }

    let zapierStatus = 'failed';
    let zapierError: string | null = null;

    // POST to Zapier webhook
    try {
      const zapierResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (zapierResponse.ok) {
        zapierStatus = 'success';
      } else {
        zapierError = `Zapier returned ${zapierResponse.status}`;
      }
    } catch (err) {
      zapierError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Log to Supabase submissions table
    const { error: submitError } = await supabaseAdmin
      .from('submissions')
      .insert([
        {
          batch_id,
          payload,
          zapier_status: zapierStatus,
          zapier_error: zapierError,
        },
      ]);

    if (submitError) {
      console.error('Failed to log submission:', submitError);
    }

    // Update batch status to submitted
    await supabaseAdmin
      .from('batches')
      .update({ status: 'approved', submitted_at: new Date().toISOString() })
      .eq('id', batch_id);

    // Fetch batch to get client email and name
    const { data: batch } = await supabaseAdmin
      .from('batches')
      .select('client_name, client_email')
      .eq('id', batch_id)
      .single();

    // Send confirmation email if client email exists
    if (batch?.client_email) {
      await sendSubmissionConfirmation(batch.client_email, batch.client_name);
    }

    // Always return success to show confirmation screen
    // (Zapier failure doesn't block the client experience)
    return Response.json({ success: true });
  } catch (err) {
    console.error('Submission error:', err);
    return Response.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
