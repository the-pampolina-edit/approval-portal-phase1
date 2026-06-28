# Zapier Webhook Setup

## Overview

When a client submits their content approvals, the app POSTs the approval payload to a Zapier webhook. Use this to automatically log approvals to HoneyBook or trigger downstream workflows.

## Payload Structure

```json
{
  "client_name": "string",
  "month": "string (e.g., 'August')",
  "year": "number (e.g., 2026)",
  "submitted_at": "ISO 8601 timestamp (e.g., '2026-08-01T14:32:00.000Z')",
  "posts": [
    {
      "id": "string (unique post ID)",
      "caption": "string",
      "scheduled_date": "YYYY-MM-DD",
      "platform": "string or null (e.g., 'Instagram', 'Facebook')",
      "status": "approved | edit_requested",
      "edit_note": "string or null (only present if status is 'edit_requested')"
    }
  ]
}
```

## Example Payload

```json
{
  "client_name": "Michelle Radakovich",
  "month": "August",
  "year": 2026,
  "submitted_at": "2026-08-01T14:32:00.000Z",
  "posts": [
    {
      "id": "post-001",
      "caption": "Summer vibes with our new collection",
      "scheduled_date": "2026-08-03",
      "platform": "Instagram",
      "status": "approved",
      "edit_note": null
    },
    {
      "id": "post-002",
      "caption": "End of summer sale announcement",
      "scheduled_date": "2026-08-07",
      "platform": "Facebook",
      "status": "edit_requested",
      "edit_note": "Can you change the CTA to 'Shop Now' instead of 'Learn More'?"
    }
  ]
}
```

## Setup Steps

1. **Create a Zapier Zap**
   - Go to zapier.com and create a new Zap
   - Choose trigger: **Webhooks by Zapier** → **Catch Raw Hook**
   - Zapier will generate a webhook URL

2. **Get Your Webhook URL**
   - Copy the webhook URL that Zapier provides

3. **Add to Environment Variables**
   - In `.env.local` (local development):
     ```
     NEXT_PUBLIC_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/[your-zapier-id]/
     ```
   - In Vercel (production):
     - Go to **Settings** → **Environment Variables**
     - Key: `NEXT_PUBLIC_ZAPIER_WEBHOOK_URL`
     - Value: Your Zapier webhook URL

4. **Map the Fields in Zapier**
   - In your Zap, use the fields from the **Payload Structure** above
   - Common next steps:
     - **Create/Update HoneyBook record** with client_name, posts, etc.
     - **Send email notification** to client with approval summary
     - **Log to spreadsheet** for record-keeping

5. **Test**
   - Submit an approval from the app
   - Check your Zapier Zap's activity log to confirm the webhook was received

## Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| client_name | string | Yes | Name of the client |
| month | string | Yes | Full month name (e.g., "August") |
| year | number | Yes | 4-digit year |
| submitted_at | ISO 8601 | Yes | When the approval was submitted |
| posts | array | Yes | Array of approved/edited posts |
| posts[].id | string | Yes | Unique post ID from Supabase |
| posts[].caption | string | Yes | Post caption text |
| posts[].scheduled_date | YYYY-MM-DD | Yes | When the post is scheduled |
| posts[].platform | string \| null | No | Social media platform (Instagram, Facebook, etc.) |
| posts[].status | string | Yes | Either "approved" or "edit_requested" |
| posts[].edit_note | string \| null | No | Only present if status is "edit_requested" |

## Troubleshooting

**Webhook not receiving data:**
- Verify the webhook URL is correct in `.env.local` or Vercel
- Check Zapier's activity log to see if requests are coming in
- Make sure `NEXT_PUBLIC_ZAPIER_WEBHOOK_URL` is set (not empty)

**Wrong data format in HoneyBook:**
- Use Zapier's formatter step to transform fields as needed
- Refer to the **Example Payload** above for exact field names

**Supabase is still the source of truth:**
- All approvals are logged to Supabase regardless of Zapier success
- Zapier webhook failures won't prevent the app from marking submissions as complete
