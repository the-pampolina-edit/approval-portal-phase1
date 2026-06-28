# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to **supabase.com**
2. Sign up / Log in
3. Click **"New Project"**
4. Name: `approval-portal`
5. Set a strong database password
6. Choose your region (closest to you)
7. Click **"Create new project"** (takes ~5 minutes)

## 2. Get Your Credentials

Once the project is created:

1. Go to **Settings** → **API**
2. Copy these three values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **Anon Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`, keep this secret!)

## 3. Update `.env.local`

Open `.env.local` in your project folder and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=<paste Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste Anon Key>
SUPABASE_SERVICE_ROLE_KEY=<paste Service Role Key>
ADMIN_PASSWORD=your-secure-password
```

**⚠️ Never commit `.env.local` to GitHub** — it's already in `.gitignore`

## 4. Create Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy everything from `database/schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** (play button)

You should see success messages. The tables and storage bucket are now created.

## 5. Test Everything

### Via Terminal:

```bash
npm run dev
```

Visit `http://localhost:3000/admin/login`

**Log in with:**
- Password: (whatever you set in `ADMIN_PASSWORD`)

You should see the admin dashboard.

### Test the workflow:

1. Click **"+ New Batch"**
2. Enter:
   - Client Name: "Test Client"
   - Month/Year: August 2026
   - Leave HoneyBook URL blank for now
3. Click **"Create Batch"**
4. The batch appears on the left. Click it.
5. Copy the magic link
6. Click **"+ Add Post"**
7. Upload an image from your computer
8. Enter caption, date, platform
9. Click **"Add Post"**

### View the client page:

Paste the magic link into your browser. You should see:
- The image you uploaded
- The caption, date, platform
- Approve / Request Edit buttons
- Submit button (disabled until you review all posts)

## 6. Deploy to Vercel

Push your changes to GitHub:

```bash
git push
```

Vercel will auto-deploy. Add these environment variables in Vercel settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

**Do NOT use the same password as your Supabase account.**

---

## Troubleshooting

**"Supabase connection failed"**
- Check your credentials in `.env.local`
- Make sure the project is running (check Supabase dashboard)
- Verify CORS is enabled (it should be by default)

**"Storage bucket not found"**
- The schema.sql creates the bucket. If it failed, run it again manually in SQL Editor.

**"RLS policy denied"**
- The database setup should handle this automatically. If not, check the policies in Supabase → Authentication → Policies.

**Images not uploading**
- Make sure the `approval-assets` bucket exists in Supabase Storage
- Check that the service role key is correct (has permission to write)

**Admin login not working**
- Verify `ADMIN_PASSWORD` is set in `.env.local`
- Check you're typing the password correctly (case-sensitive)

---

## What Happens Behind the Scenes

1. **Admin creates batch** → Supabase `batches` table stores client name, month/year, magic link token
2. **Admin uploads images** → Files go to Supabase Storage (`approval-assets` bucket), URLs stored in `posts` table
3. **Client visits magic link** → App loads batch + posts from Supabase via token
4. **Client approves/edits** → App updates post records in database
5. **Client submits** → Data POSTs to Zapier webhook

All data stays in your Supabase project. No files on your server.

---

## Next: Set Up Zapier (Optional)

When you're ready to log approvals to HoneyBook:

1. Create a Zapier account
2. Create a "Catch Webhook" trigger
3. Zapier will give you a webhook URL
4. Add it to `.env.local`: `NEXT_PUBLIC_ZAPIER_WEBHOOK_URL=...`
5. Redeploy to Vercel

That's it. Supabase is set up and ready to go.
