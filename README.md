# Pampolina Edit — Content Approval Portal (Phase 1)

A lightweight client-facing approval page. Clients review content cards inline, approve or request edits with feedback, submit — and data posts to Zapier for HoneyBook logging.

**Hosting:** `approvals.the-pampolina-edit.com`

---

## What This Does

Clients receive a magic link like:
```
https://approvals.the-pampolina-edit.com/approve/august-kind-co
```

The page displays:
- **Header:** Pampolina Edit, client name, month/year
- **Content grid:** One card per post (image/video, caption, date, platform)
- **Approval buttons on each card:** ✓ Approve | ✗ Request Edit
- **Feedback box:** Appears when client clicks "Request Edit"
- **Submit button:** Disabled until all posts reviewed
- **On submit:** POSTs approval data to Zapier webhook
- **Confirmation:** "You're all set" message

Zapier handles logging approvals to HoneyBook — the client never sees HoneyBook.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
```

Add your Zapier webhook URL:
```
NEXT_PUBLIC_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID/
```

### 3. Run locally
```bash
npm run dev
```

Visit: `http://localhost:3000/approve/august-kind-co`

Test the flow:
- Click ✓ Approve on a post
- Click ✗ Edit on another post and type feedback
- Submit button enables
- Click Submit
- Confirmation page appears

---

## Content JSON Format

File: `/public/content/{token}.json`

```json
{
  "client": {
    "name": "Client Name",
    "honeybook_url": "https://honeybook.com/smart-file-url"
  },
  "month": "August",
  "year": 2026,
  "token": "august-kind-co",
  "expires_at": "2026-08-10T23:59:59Z",
  "posts": [
    {
      "id": "post-001",
      "type": "image",
      "asset_url": "https://example.com/image.jpg",
      "caption": "Post caption here",
      "scheduled_date": "2026-08-03",
      "platform": "Instagram"
    },
    {
      "id": "post-002",
      "type": "video",
      "asset_url": "https://example.com/video.mp4",
      "caption": "Video caption",
      "scheduled_date": "2026-08-05",
      "platform": "Instagram Reels"
    }
  ]
}
```

### Fields

| Field | Type | Notes |
|-------|------|-------|
| `client.name` | string | Displayed in header |
| `client.honeybook_url` | string | (Not used in Phase 1; kept for future) |
| `month` | string | Month name (e.g., "August") |
| `year` | number | 4-digit year |
| `token` | string | URL token; must match filename without `.json` |
| `expires_at` | string | ISO 8601; link invalid after this date |
| `posts` | array | Array of Post objects |

### Post Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique per batch |
| `type` | string | `"image"` or `"video"` |
| `asset_url` | string | Full public URL (CORS-enabled) |
| `caption` | string | Post copy |
| `scheduled_date` | string | YYYY-MM-DD |
| `platform` | string? | Optional: "Instagram", "Facebook", "TikTok", etc. |

---

## Zapier Webhook Payload

When client clicks "Submit", the page POSTs this JSON to your webhook URL:

```json
{
  "client_name": "Michelle Radakovich",
  "month": "August 2026",
  "submitted_at": "2026-08-03T14:32:00Z",
  "posts": [
    {
      "asset_filename": "image.jpg",
      "caption": "New collection launch",
      "scheduled_date": "2026-08-03",
      "status": "approved",
      "edit_note": null
    },
    {
      "asset_filename": "video.mp4",
      "caption": "Behind-the-scenes",
      "scheduled_date": "2026-08-05",
      "status": "edit_requested",
      "edit_note": "Can you add captions to this video?"
    }
  ]
}
```

### Payload Fields

| Field | Type | Notes |
|-------|------|-------|
| `client_name` | string | From JSON config |
| `month` | string | Formatted "August 2026" |
| `submitted_at` | string | ISO 8601 timestamp |
| `posts` | array | Array of submission objects |

### Post Submission Fields

| Field | Type | Notes |
|-------|------|-------|
| `asset_filename` | string | Extracted from `asset_url` |
| `caption` | string | Original post caption |
| `scheduled_date` | string | YYYY-MM-DD |
| `status` | string | `"approved"` or `"edit_requested"` |
| `edit_note` | string \| null | Client feedback; null if approved |

---

## Setting Up Zapier

1. **Create a Zapier account** at zapier.com
2. **Create a new Zap:**
   - **Trigger:** Catch Hook (receives POST from this app)
   - **Action:** Log to HoneyBook / create task / send email / etc.
3. **Copy the webhook URL** Zapier gives you
4. **Add to `.env.local`:**
   ```
   NEXT_PUBLIC_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID/
   ```

Example Zapier Zap:
- **Trigger:** Webhooks by Zapier → Catch Raw Hook
- **Action:** HoneyBook → Create / Update Record (or whatever logging you need)
- Map fields from the JSON payload to HoneyBook fields

---

## Creating a New Batch

1. Create `/public/content/{token}.json`:
   ```bash
   touch public/content/my-new-batch.json
   ```

2. Populate with client data and posts (see example above)

3. Share link:
   ```
   https://approvals.the-pampolina-edit.com/approve/my-new-batch
   ```

4. Test locally first:
   ```
   http://localhost:3000/approve/my-new-batch
   ```

---

## Brand Colors

- **Background:** Optical white `#F5F5F0`
- **Text:** Onyx `#0A0A0A`
- **CTA Button:** Electric cobalt `#2563EB`
- **Confirm Icon:** Acid lemon `#CCFF00`

---

## Deployment

### To Vercel

```bash
git push
# (auto-deploys if connected to Vercel)
```

Set domain: `approvals.the-pampolina-edit.com`

### Manual

```bash
npm run build
npm start
```

---

## Troubleshooting

**"Content not found"**
- Check filename matches token (case-sensitive)
- Verify JSON is valid (jsonlint.com)

**"Zapier webhook URL not configured"**
- Add `NEXT_PUBLIC_ZAPIER_WEBHOOK_URL` to `.env.local`
- If testing locally without Zapier, comment out webhook POST in the code

**Images/videos not loading**
- Ensure asset URLs are public
- Check browser console for CORS errors
- Use Unsplash, Pexels, or AWS S3 for reliable hosting

**Submit button disabled**
- All posts must be actioned (approved OR requested edit)
- Check counter at bottom: "X of Y reviewed"

---

## Files

- `app/approve/[token]/page.tsx` — Main approval page
- `lib/content.ts` — Content loader
- `public/content/` — JSON batches live here
- `.env.example` — Environment template

---

## Next Phase (Phase 2)

Admin dashboard for:
- Creating batches without manual JSON
- Client management
- Approval status tracking
- Magic link generation
- Google Drive integration (optional)

---

## Questions?

Refer to the payload structure and Zapier setup above. Test locally first, then deploy.
