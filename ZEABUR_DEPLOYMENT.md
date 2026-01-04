# Zeabur Deployment Guide

## How to Connect Zeabur

**Zeabur connects via GitHub** (not Cursor). Here's the recommended approach:

### Option 1: Connect via GitHub (Recommended) ✅

1. **Push your project to GitHub** (if not already):
   ```bash
   # Create a new GitHub repository first, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect Zeabur to GitHub**:
   - Go to [Zeabur Dashboard](https://dash.zeabur.com)
   - Click "New Project"
   - Select "Import from GitHub"
   - Authorize Zeabur to access your GitHub
   - Select your repository
   - Zeabur will auto-detect your project type (Vite/React)

3. **Configure Environment Variables**:
   - In Zeabur dashboard, go to your project → Settings → Environment Variables
   - Add:
     ```
     GEMINI_API_KEY=your_gemini_api_key
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### Option 2: Connect via Zeabur CLI (Alternative)

If you prefer CLI deployment:

```bash
# Install Zeabur CLI
npm i -g zeabur

# Login
zeabur login

# Deploy
zeabur deploy
```

## Current Git Setup Issue

Your git remote is currently pointing to the InsForge repository. You'll want to:

1. **Create your own GitHub repository** for this project
2. **Update the git remote** to point to your repo
3. **Push your code** to GitHub
4. **Connect Zeabur** to your GitHub repo

## Steps to Fix Git Remote

```bash
# Check current remote
git remote -v

# Remove incorrect remote (if needed)
git remote remove origin

# Add your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/teach-in-minutes.git

# Push to GitHub
git push -u origin main
```

## Zeabur vs Vercel

Both platforms work similarly:
- **Vercel**: Currently deployed, works great
- **Zeabur**: Alternative platform, similar features

You can use either or both! Many developers use:
- Vercel for production
- Zeabur for staging/testing

## Recommended Approach

1. ✅ **Use GitHub** to connect Zeabur (standard practice)
2. ✅ **Keep your code on GitHub** (version control + deployment)
3. ✅ **Use Cursor** to edit code locally
4. ✅ **Zeabur auto-deploys** when you push to GitHub

## Next Steps

1. Create a GitHub repository for your project
2. Update git remote to point to your repo
3. Push your code to GitHub
4. Connect Zeabur via GitHub integration
5. Configure environment variables in Zeabur

Need help setting up the GitHub repository? Let me know!

