-- Create batches table
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  honeybook_url TEXT NOT NULL,
  magic_link_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_reviewed', 'approved', 'needs_edits')),
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'edit_requested')),
  edit_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table (log of all client submissions)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  zapier_status TEXT NOT NULL DEFAULT 'pending' CHECK (zapier_status IN ('pending', 'success', 'failed')),
  zapier_error TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_batches_token ON batches(magic_link_token);
CREATE INDEX idx_batches_expires_at ON batches(expires_at);
CREATE INDEX idx_posts_batch_id ON posts(batch_id);
CREATE INDEX idx_submissions_batch_id ON submissions(batch_id);

-- Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public can view batches via valid token
CREATE POLICY "Public view batch" ON batches
  FOR SELECT
  USING (expires_at > CURRENT_TIMESTAMP);

-- Public can view posts in valid batches
CREATE POLICY "Public view posts" ON posts
  FOR SELECT
  USING (batch_id IN (SELECT id FROM batches WHERE expires_at > CURRENT_TIMESTAMP));

-- Public can update posts (approve/edit)
CREATE POLICY "Public update posts" ON posts
  FOR UPDATE
  USING (batch_id IN (SELECT id FROM batches WHERE expires_at > CURRENT_TIMESTAMP))
  WITH CHECK (batch_id IN (SELECT id FROM batches WHERE expires_at > CURRENT_TIMESTAMP));

-- Public can update batch submitted_at
CREATE POLICY "Public update batch" ON batches
  FOR UPDATE
  USING (expires_at > CURRENT_TIMESTAMP)
  WITH CHECK (expires_at > CURRENT_TIMESTAMP);

-- Service role has full access
CREATE POLICY "Service role all batches" ON batches
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role all posts" ON posts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create storage bucket for images/videos
INSERT INTO storage.buckets (id, name, public) VALUES ('approval-assets', 'approval-assets', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read assets" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'approval-assets');

CREATE POLICY "Service role manage assets" ON storage.objects
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
