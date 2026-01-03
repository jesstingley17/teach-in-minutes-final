# Supabase Setup Guide for Blueprint Pro

## 1. Database Setup

Run the SQL schemas in your Supabase SQL Editor. You need to run THREE separate schema files:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each schema file in order:

### Step 1: Main Schema (instructional_suites table)
Copy and paste the contents of `supabase/schema.sql` and run it.

This creates:
- `instructional_suites` table (for saving drafts)
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp updates function

### Step 2: Parsed Curriculums Schema
Copy and paste the contents of `supabase/parsed_curriculums_schema.sql` and run it.

This creates:
- `parsed_curriculums` table (for saving parsed curriculum documents)
- Indexes and RLS policies

### Step 3: User Settings Schema
Copy and paste the contents of `supabase/user_settings_schema.sql` and run it.

This creates:
- `user_settings` table (for user preferences)
- Indexes and RLS policies

**Important:** Run all three schema files to enable full functionality!

## 2. Authentication Setup

Enable Email Authentication in Supabase:

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication → Email Templates**
   - Customize confirmation and password reset emails

**Email Confirmation Options:**
- **Enable email confirmations** - Users must verify email before signing in (recommended)
- **Disable email confirmations** - Users can sign in immediately (for development)

Go to **Authentication → Settings** to configure:
- Password requirements
- Email templates
- Redirect URLs (add your Vercel domain)

## 3. Environment Variables

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

## 4. Features

### User Authentication
- Sign up with email and password
- Sign in to access your saved work from any device
- Each user's work is private and secure (RLS policies)
- Anonymous mode still available if not signed in (localStorage fallback)

### Automatic Migration
- Existing localStorage data will automatically migrate to Supabase on first load
- Migration happens once and clears localStorage after success

### Cloud Storage
- All drafts are saved to Supabase with user authentication
- Accessible from any device when signed in
- Automatic sync across sessions

### Fallback Mode
- If Supabase credentials are not configured, app falls back to localStorage
- No data loss if Supabase is unavailable

## 5. User Flow

1. **First Visit (No Supabase)**:
   - App uses localStorage for saving drafts
   - Works offline with full functionality

2. **After Supabase Setup**:
   - Users see "Sign In / Sign Up" button in sidebar
   - Can continue using localStorage without signing in
   - OR sign up to sync work across devices

3. **Signed In Users**:
   - All drafts saved to their Supabase profile
   - Work persists across devices
   - Profile shows email and sign out option

## 6. Testing

1. Test sign up: Create a new account
2. Check email for verification (if enabled)
3. Sign in and create a draft
4. Verify draft appears in Supabase Dashboard → Database → instructional_suites
5. Sign out and sign in again - verify drafts persist
6. Test on different browser/device - verify sync works

## 7. Future Enhancements

Consider adding:
- Password reset functionality
- Social auth providers (Google, GitHub)
- Real-time collaboration
- Sharing suites with others
- Team workspaces
