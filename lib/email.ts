export async function sendSubmissionConfirmation(
  clientEmail: string,
  clientName: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@pampolina-edit.com',
        to: clientEmail,
        subject: 'Your Content Approval Submitted',
        html: `
          <h2>Submission Received</h2>
          <p>Hi ${clientName},</p>
          <p>Thank you for reviewing and submitting your content approvals. We've received your feedback and will get started on the next steps right away.</p>
          <p>If you have any questions, feel free to reach out!</p>
          <p>Best regards,<br/>Pampolina Edit</p>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
