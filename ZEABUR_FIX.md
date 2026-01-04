# Fixing Zeabur Build Error

## The Problem

Zeabur was trying to parse JavaScript/TypeScript files as a Dockerfile, causing the error:
```
Syntax error - can't find = in "const". Must be of the form: name=value
```

This happened because:
1. The `zeabur.json` used uppercase "NIXPACKS" instead of lowercase "nixpacks"
2. A Dockerfile was present, causing Zeabur to prioritize Docker mode
3. Zeabur then tried to parse source files as Dockerfiles incorrectly

## Solution Applied

I've fixed the configuration:

1. **zeabur.json** - Corrected to use lowercase "nixpacks" builder
2. **Dockerfile** - Removed (not needed for Nixpacks)
3. **.dockerignore** - Can be kept but is not used by Nixpacks

## What Zeabur Will Do Now

With Nixpacks enabled, Zeabur will automatically:
- Detect your Vite/React app
- Run `npm install` to install dependencies
- Run `npm run build` to build your app
- Serve the `dist` directory as a static site
- Handle React Router routing correctly

## Deployment Steps

1. **Commit and push the fixed configuration:**
   ```bash
   git add zeabur.json
   git rm Dockerfile
   git commit -m "Fix Zeabur configuration - use Nixpacks with correct format"
   git push
   ```

2. **Zeabur will automatically redeploy** when you push to GitHub

3. **Set Environment Variables in Zeabur Dashboard:**
   - Go to **Settings** → **Environment Variables**
   - Add all your API keys (see `ZEABUR_ENV_VARS.md`)
   - Required variables:
     - `GEMINI_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`

4. **Monitor the build:**
   - Check the build logs in Zeabur dashboard
   - Should see "Using Nixpacks builder"
   - Build should complete successfully

## What Changed

### zeabur.json (Fixed)
```json
{
  "build": {
    "builder": "nixpacks"
  }
}
```

The minimal configuration is all Nixpacks needs. It will:
- Auto-detect your package.json
- Auto-detect your build script
- Auto-detect your output directory (dist)
- Handle everything automatically

### Dockerfile (Removed)
The Dockerfile has been removed because:
- Nixpacks doesn't need it
- Having it present caused Zeabur to try Docker mode
- Nixpacks is simpler and better for Vite/React apps

## Troubleshooting

If you still get errors:

1. **Check Build Logs:**
   - Look at the build logs in Zeabur dashboard
   - Should see "Using Nixpacks builder"
   - Should NOT see any Docker-related messages

2. **Verify package.json:**
   - Ensure `"build": "vite build"` script exists
   - Ensure all dependencies are listed

3. **Check Environment Variables:**
   - Make sure all required env vars are set in Zeabur
   - See `ZEABUR_ENV_VARS.md` for the complete list

4. **Manual Redeploy:**
   - If auto-deploy doesn't trigger, manually redeploy in dashboard

## Why Nixpacks?

Nixpacks is the recommended approach for Vite/React apps because:
- Automatically detects your framework
- No Docker knowledge required
- Faster builds
- Better caching
- Simpler configuration
- Official Zeabur recommendation for Node.js apps

