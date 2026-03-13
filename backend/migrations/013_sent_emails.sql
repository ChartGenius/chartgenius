CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_segment TEXT NOT NULL,
  to_addresses TEXT[],
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'sent',
  sent_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sent_emails' AND policyname='Service role full access') THEN
    CREATE POLICY "Service role full access" ON sent_emails USING (true) WITH CHECK (true);
  END IF;
END $$;
