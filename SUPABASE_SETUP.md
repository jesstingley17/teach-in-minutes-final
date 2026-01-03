# Supabase Setup Guide for Blueprint Pro

## 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL query

This will create:
- `instructional_suites` table
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp updates

## 2. Environment Variables

### In Vercel:

Add these environment variables in **Vercel Dashboard → Settings → Environment Variables**:

```
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get your Supabase credentials from:
- Dashboard → Settings → API
- URL: Project URL
- ANON_KEY: anon/public key

### For Local Development:

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Features

### Automatic Migration
- Existing localStorage data will automatically migrate to Supabase on first load
- Migration happens once and clears localStorage after success

### Cloud Storage
- All drafts are saved to Supabase
- Accessible from any device
- Automatic sync across sessions

### Fallback Mode
- If Supabase credentials are not configured, app falls back to localStorage
- No data loss if Supabase is unavailable

## 4. Future Enhancements

Consider adding:
- User authentication (Supabase Auth)
- Real-time collaboration
- Sharing suites with others
- Export history tracking
- Version control for drafts

## 5. Testing

After setup:
1. ✅ Verify environment variables are set in Vercel
2. ✅ Run the SQL schema in Supabase
3. ✅ Check console logs for "Supabase enabled: true"
4. ✅ Create a draft and verify it appears in Supabase dashboard
5. ✅ Refresh page and verify draft persists

## 6. Monitoring

Check your Supabase dashboard:
- **Database → Tables → instructional_suites** to view all saved drafts
- **API → Logs** to monitor API calls
- **Authentication** (if you add auth later)
