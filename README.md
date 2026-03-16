# Second Brain — Dashboard + Digest Functions

Dashboard and serverless functions for Tim's Second Brain daily digest system.

## How it works

1. **Make.com pipeline** (runs daily): Airtable → RSS → TranscriptAPI → Claude API → Parse JSON → Supabase
2. **Dashboard** (`/`): Live view of all digest items with track filtering, relevance sorting, expandable cards
3. **Digest function** (`/api/digest`, runs 30 min after Make): Supabase → Mem notes

## What's included

| Path | Purpose |
|---|---|
| `public/index.html` | Dashboard — connects to Supabase, shows all digest items with filtering/sorting |
| `/api/digest` | Cron function — fetches new items, formats as markdown, pushes to Mem |
| `/api/test-digest` | Dry-run preview — shows what would be pushed without actually sending |

## Setup

### 1. Prerequisites
- Supabase project with `digest_items` table (already exists)
- Supabase anon key (from Settings > API > anon/public key)
- Mem API key
- Vercel account
- GitHub account (for deployment)

### 2. Add the Supabase anon key to the dashboard

Open `public/index.html` and replace `REPLACE_WITH_YOUR_ANON_KEY` with your
Supabase anon (public) key. This is safe to expose in frontend code — it only
allows read access based on your Row Level Security policies.

Find this line near the top of the `<script>` block:
```js
const SUPABASE_ANON_KEY = "REPLACE_WITH_YOUR_ANON_KEY";
```

### 3. Enable Row Level Security (run in Supabase SQL editor)

```sql
-- Allow public read access to digest_items
ALTER TABLE digest_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON digest_items FOR SELECT USING (true);

-- Add sync tracking columns for the Mem function
ALTER TABLE digest_items
ADD COLUMN IF NOT EXISTS synced_to_mem BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Clean up junk test data
DELETE FROM digest_items
WHERE headline IS NULL
   OR title = 'test title'
   OR summary = 'test summary';
```

### 4. Deploy to Vercel

```bash
# Clone or upload this folder to a GitHub repo, then:
vercel link
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add MEM_API_KEY
vercel env add CRON_SECRET
vercel deploy --prod
```

### 4. Test

Visit `https://your-app.vercel.app/api/test-digest` in your browser.
You should see a preview of today's digest items formatted as Mem notes.

### 5. Verify Mem push

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/digest
```

Check Mem for the new notes.

### 6. Cron schedule

The `vercel.json` cron is set to `30 10 * * *` (10:30 AM UTC = 6:30 AM ET).
Adjust to match your preferred delivery time. Make sure your Make pipeline
runs at least 30 minutes before this.

**Note:** Vercel cron jobs require a Pro plan ($20/mo) or higher. On the free
Hobby plan, you can trigger the function manually or use an external cron
service like cron-job.org (free) to hit the `/api/digest` endpoint daily.

## Deployment via Perplexity Computer

You can hand this entire deployment to Perplexity with this prompt:

```
Deploy my Second Brain dashboard to Vercel. Here's what to do:

1. Go to github.com and create a new repo called "second-brain-dashboard"
2. Upload all files from the second-brain-vercel folder I'll provide
3. Before uploading, open public/index.html and replace 
   REPLACE_WITH_YOUR_ANON_KEY with my Supabase anon key 
   (find it at supabase.com > project vyqzenbiopldebrmfmoh > Settings > API > anon public key)
4. Go to vercel.com, import the GitHub repo
5. Add these environment variables in Vercel:
   - SUPABASE_URL = https://vyqzenbiopldebrmfmoh.supabase.co
   - SUPABASE_SERVICE_KEY = (from Supabase Settings > API > service_role key)
   - MEM_API_KEY = (from mem.ai settings)
   - CRON_SECRET = (generate a random string)
6. Deploy
7. Run the SQL commands from the README in Supabase SQL editor
8. Visit the deployed URL and verify the dashboard loads with data
```

## Troubleshooting

| Issue | Fix |
|---|---|
| No items found | Check that Make ran today and inserted rows. Verify `created_at` timestamps. |
| Mem push fails | Check MEM_API_KEY is valid. Mem API may rate limit — the function adds 500ms delay between pushes. |
| Duplicate Mem notes | The function only processes items where `synced_to_mem` is false/null. If you re-run, it won't duplicate. |
| Items missing fields | The filter excludes rows with null headline or "test title"/"test summary" values. |
