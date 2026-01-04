# Deployment Guide

This app can be deployed to **both Vercel and Zeabur** from the same GitHub repository.

## Vercel Deployment ✅

### Configuration
- Uses `vercel.json` for configuration
- Automatically deploys the frontend + `/api` serverless functions
- React Router routing handled via rewrites

### Setup
1. **Connect via GitHub:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

2. **Environment Variables:**
   Add in Vercel Dashboard → Settings → Environment Variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy:**
   - Pushes to `main` branch auto-deploy
   - Vercel builds using `npm run build`
   - Serves `dist` folder + API functions

## Zeabur Deployment ✅

### Configuration
- Uses `zeabur.json` for configuration
- Uses Nixpacks builder (auto-detects everything)
- Static site deployment

### Setup
1. **Connect via GitHub:**
   - Go to [Zeabur Dashboard](https://dash.zeabur.com)
   - Create new project → Import from GitHub
   - Select your repository

2. **Build Settings:**
   - Builder: **Nixpacks** (auto-detected via `zeabur.json`)
   - Command: *(leave empty)*
   - Dockerfile: *(leave empty)*
   - Root Directory: `/`

3. **Environment Variables:**
   Add in Zeabur Dashboard → Settings → Environment Variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy:**
   - Pushes to your branch auto-deploy
   - Nixpacks builds using `npm run build`
   - Serves `dist` folder as static site

## Configuration Files

### For Vercel:
- `vercel.json` - Vercel-specific configuration
- `/api/**/*.ts` - Serverless functions (Vercel only)
- `package.json` - Build scripts

### For Zeabur:
- `zeabur.json` - Zeabur-specific configuration
- `package.json` - Build scripts

### Shared:
- `package.json` - Dependencies and build scripts
- `vite.config.ts` - Vite build configuration
- `dist/` - Built output (generated during build)

## How Both Work Together

Both platforms can deploy from the same GitHub repo because:
- ✅ Each platform reads its own config file (`vercel.json` vs `zeabur.json`)
- ✅ Each platform ignores the other's config file
- ✅ Both use the same build command: `npm run build`
- ✅ Both serve the same output: `dist` folder
- ✅ Environment variables are set separately in each dashboard

## Differences

| Feature | Vercel | Zeabur |
|---------|--------|--------|
| Frontend | ✅ | ✅ |
| Serverless Functions | ✅ `/api` folder | ❌ |
| Build System | Vercel Build | Nixpacks |
| Config File | `vercel.json` | `zeabur.json` |
| Auto-deploy | ✅ | ✅ |

## Recommended Setup

**Use Vercel for production** because:
- Includes serverless API functions
- Better for full-stack apps
- More mature platform

**Use Zeabur for:**
- Testing/staging environments
- Alternative deployment option
- Frontend-only deployment

## Troubleshooting

### Vercel Issues
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure `/api` functions are working

### Zeabur Issues
- Check build logs in Zeabur dashboard
- Verify builder is set to "Nixpacks"
- Ensure environment variables are set

### Both Platforms
- Make sure all environment variables are set in both dashboards
- Check that `npm run build` works locally
- Verify `dist` folder is generated correctly

