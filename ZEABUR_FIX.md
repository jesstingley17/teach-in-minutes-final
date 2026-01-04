# Fixing Zeabur Build Error

## The Problem

Zeabur was trying to parse JavaScript/TypeScript files as a Dockerfile, causing the error:
```
Syntax error - can't find = in "const". Must be of the form: name=value
```

## Solution

I've created the necessary files to fix this:

1. **Dockerfile** - Proper Docker configuration for Vite React app
2. **zeabur.json** - Explicit Zeabur configuration to use Nixpacks
3. **.dockerignore** - Excludes unnecessary files from Docker build

## What to Do Next

### Option 1: Use Nixpacks (Recommended - Easiest)

1. **In Zeabur Dashboard:**
   - Go to your project → **Settings** → **Build Settings**
   - Change builder from "Docker" to **"Nixpacks"** or **"Auto-detect"**
   - Zeabur will automatically detect your Vite app

2. **Zeabur will auto-detect:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - No start command needed (static site)

### Option 2: Use Dockerfile (If Docker is Required)

If Zeabur requires Docker, the `Dockerfile` I created will work. It:
- Builds your Vite app using Node.js
- Serves it with nginx
- Handles React Router (all routes → index.html)

## Files Created

### Dockerfile
- Multi-stage build (builder + production)
- Uses Node.js 18 Alpine for building
- Uses nginx Alpine for serving
- Handles SPA routing correctly

### zeabur.json
- Tells Zeabur to use Nixpacks builder
- Specifies build command: `npm run build`
- Specifies output: `dist` directory
- Configures routes for React Router

### .dockerignore
- Excludes unnecessary files from Docker build
- Reduces build time and image size
- Excludes test files, scripts, documentation

## Deployment Steps

1. **Commit and push the new files:**
   ```bash
   git add Dockerfile zeabur.json .dockerignore
   git commit -m "Fix Zeabur deployment configuration"
   git push
   ```

2. **In Zeabur Dashboard:**
   - Go to **Settings** → **Build Settings**
   - Select **"Nixpacks"** or **"Auto-detect"** (recommended)
   - Or select **"Dockerfile"** if you want to use Docker

3. **Set Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Add all your API keys (see `ZEABUR_ENV_VARS.md`)

4. **Redeploy:**
   - Zeabur should automatically redeploy when you push
   - Or manually trigger redeploy in dashboard

## Recommended Approach

**Use Nixpacks (Option 1)** - It's simpler, faster, and Zeabur handles everything automatically for Vite/React apps. No Docker knowledge needed!

The Dockerfile is there as a backup if Zeabur requires it, but Nixpacks is the better choice for Vite apps.

## Troubleshooting

If you still get errors:

1. **Check Build Settings:**
   - Ensure builder is set to "Nixpacks" not "Docker"
   - Or if using Docker, ensure "Dockerfile" is selected

2. **Check Build Logs:**
   - Look at the build logs in Zeabur dashboard
   - The error message will tell you what's wrong

3. **Verify package.json:**
   - Ensure `"build": "vite build"` script exists
   - Ensure all dependencies are listed

4. **Check Environment Variables:**
   - Make sure all required env vars are set in Zeabur
   - See `ZEABUR_ENV_VARS.md` for the list

