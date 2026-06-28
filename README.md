# Pampolina Edit — Content Approval Portal (Phase 1)

A lightweight, branded client-facing page for viewing and approving content calendars. No database, no admin dashboard — just a clean viewing layer that sits in front of HoneyBook Smart Files.

**Hosting:** `approvals.the-pampolina-edit.com`

---

## What This Does

Clients receive a magic link like:
```
https://approvals.the-pampolina-edit.com/approve/august-kind-co
```

The page loads content from a JSON file (`/public/content/{token}.json`), displays:
- **Header:** Client name, month/year, Pampolina Edit wordmark
- **Grid:** One card per post (image/video, caption, scheduled date, platform label)
- **Footer CTA:** Button linking to their HoneyBook Smart File
- **Confirmation:** After clicking through, shows "You're all set" message

Content is fetched client-side. Links expire after 5 days (configurable per batch).

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run locally
```bash
npm run dev
```

Visit:
- Home: `http://localhost:3000`
- Example batch: `http://localhost:3000/approve/august-kind-co`

### 3. Create a new batch

Add a JSON file to `/public/content/` with this structure:

```json
{
  "client": {
    "name": "Client Name",
    "honeybook_url": "https://honeybook.com/your-smart-file-url"
  },
  "month": "August",
  "year": 2026,
  "token": "unique-token-here",
  "expires_at": "2026-08-10T23:59:59Z",
  "posts": [
    {
      "id": "post-001",
      "type": "image",
      "asset_url": "https://...",
      "caption": "Post caption here",
      "scheduled_date": "2026-08-03",
      "platform": "Instagram"
    }
  ]
}
```

Share the link: `https://approvals.the-pampolina-edit.com/approve/unique-token-here`

---

## Content JSON Format

### Root Object
| Field | Type | Notes |
|-------|------|-------|
| `client.name` | string | Displayed in header |
| `client.honeybook_url` | string | External link for CTA button |
| `month` | string | Month name (e.g., "August") |
| `year` | number | 4-digit year |
| `token` | string | Used in URL; filename without `.json` |
| `expires_at` | string | ISO 8601 datetime; link invalid after |
| `posts` | array | Array of Post objects |

### Post Object
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique identifier |
| `type` | string | `"image"` or `"video"` |
| `asset_url` | string | Full URL to asset (public, CORS-enabled) |
| `caption` | string | Post copy/description |
| `scheduled_date` | string | YYYY-MM-DD format |
| `platform` | string? | Optional: "Instagram", "Facebook", etc. |

---

## Brand

- **Background:** Optical white `#F5F5F0`
- **Text:** Onyx `#0A0A0A`
- **CTA Button:** Electric cobalt `#2563EB`
- **Accent:** Acid lemon `#CCFF00` (checkmark in confirmation)

Mobile-first, editorial, premium feel.

---

## Deployment

### To Vercel

```bash
git push
# (connected to Vercel)
# Set domain: approvals.the-pampolina-edit.com
```

### Manual

```bash
npm run build
npm start
```

---

## How It Works

1. Token from URL → fetch `/public/content/{token}.json`
2. Check if `expires_at` is in future; if past, show error
3. Render grid of posts (images/videos, captions, dates)
4. CTA button opens HoneyBook URL in new tab
5. After click, show "You're all set" confirmation (cosmetic)

No backend; no database. All static.

---

## Security Notes

- **Tokens are simple strings** — upgrade in Phase 2 if needed
- **Content is public once token known** — keep tokens secret, rotate often
- **Expiry is client-side** — sufficient for viewing-only Phase 1
- **No auth required** — intentional for this phase

---

## Troubleshooting

**"Content not found"**
- JSON filename must match token (case-sensitive)
- Verify JSON syntax (use jsonlint.com)
- Check `expires_at` is in the future

**Images/videos not loading**
- Ensure URLs are public and CORS-enabled
- Check browser console for 403/404 errors

**Link expired**
- Create new JSON with future `expires_at`
- Share new link

---

## Files

- `app/approve/[token]/page.tsx` — Main viewing page
- `lib/content.ts` — Content loader, validation
- `public/content/august-kind-co.json` — Example batch

---

## Next Phase (Phase 2)

Admin dashboard for:
- Creating batches without JSON files
- Client management
- Magic link generation
- Approval status tracking
- Google Drive integration (optional)

---

## Asset Tips

**Images:** Min 1200px wide, JPG/PNG, public CDN (Unsplash, S3, etc.)
**Videos:** MP4, <10MB, public CDN
**URLs:** Must be public, CORS-enabled
