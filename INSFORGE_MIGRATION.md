# InsForge Migration Guide

Complete guide for migrating from Vercel API routes to InsForge serverless functions.

## Overview

This guide will help you migrate your Teach-in-Minutes application from Vercel serverless functions to InsForge backend platform.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- Git installed
- Your existing API keys (Gemini, Gamma, etc.)

## Step 1: Set Up InsForge

### 1.1 Clone and Configure InsForge

```bash
# Navigate to your projects directory (outside your current project)
cd ~/Documents

# Clone InsForge
git clone https://github.com/insforge/insforge.git
cd insforge

# Copy environment template
cp .env.example .env
```

### 1.2 Configure Environment Variables

Edit `.env` file in the InsForge directory:

```bash
# Required: AI API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional
ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional

# Required: Integration Keys
GAMMA_API_KEY=your_gamma_api_key
ADOBE_CLIENT_ID=your_adobe_client_id  # If using Adobe
ADOBE_CLIENT_SECRET=your_adobe_client_secret  # If using Adobe

# Environment
NODE_ENV=development

# CORS (add your Vercel frontend URL)
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

### 1.3 Start InsForge

```bash
docker compose up
```

Wait for all services to start. You should see:
- InsForge API running on `http://localhost:7131`
- Dashboard available at `http://localhost:7131` (or check docker logs)

## Step 2: Copy Function Files

### 2.1 Create Function Directory Structure

In your InsForge project directory:

```bash
mkdir -p functions/curriculum
mkdir -p functions/documents
mkdir -p functions/integrations/gamma
mkdir -p functions/integrations/adobe
```

### 2.2 Copy Function Files

Copy the function files from `insforge-functions/` directory in your project:

```bash
# From your teach-in-minutes project root
cp -r insforge-functions/* ../insforge/functions/
```

Or manually copy:
- `insforge-functions/curriculum/analyze.ts` → `insforge/functions/curriculum/analyze.ts`
- `insforge-functions/curriculum/analyze-stream.ts` → `insforge/functions/curriculum/analyze-stream.ts`
- `insforge-functions/documents/parse.ts` → `insforge/functions/documents/parse.ts`
- `insforge-functions/integrations/gamma/enhance.ts` → `insforge/functions/integrations/gamma/enhance.ts`

### 2.3 Copy Service Files

You need to make your service files available to InsForge functions. Options:

**Option A: Copy services directory (Recommended for production)**
```bash
# From your teach-in-minutes project
cp -r services ../insforge/
cp -r src ../insforge/
```

**Option B: Use symlinks (Recommended for development)**
```bash
# Create symlinks (Linux/Mac)
cd ../insforge
ln -s ../teach-in-minutes-final/services services
ln -s ../teach-in-minutes-final/src src
```

**Option C: Bundle services (Advanced)**
- Use a bundler (esbuild, webpack) to create a single file with all dependencies

## Step 3: Update Frontend Configuration

### 3.1 Update Environment Variables

Add to your frontend `.env.local`:

```bash
# For local development with InsForge
VITE_INSFORGE_API_URL=http://localhost:7131/api

# For production (after deploying InsForge)
# VITE_INSFORGE_API_URL=https://your-insforge-instance.com/api
```

### 3.2 API Routes Configuration

The `src/config/apiRoutes.ts` has been updated to automatically use InsForge if `VITE_INSFORGE_API_URL` is set, otherwise it falls back to Vercel API routes.

**Local Development:**
- Set `VITE_INSFORGE_API_URL=http://localhost:7131/api` to use InsForge
- Leave unset to use Vercel API routes

**Production:**
- Set `VITE_INSFORGE_API_URL=https://your-insforge-instance.com/api` in Vercel environment variables
- Or leave unset to continue using Vercel API routes

## Step 4: Deploy Functions

### 4.1 Local Testing

Functions should be automatically available when InsForge is running.

Test endpoints:
```bash
# Make script executable (if not already)
chmod +x scripts/test-insforge-endpoints.sh

# Run tests
./scripts/test-insforge-endpoints.sh
```

### 4.2 Production Deployment

Follow InsForge deployment documentation:
1. Push your InsForge project to a repository
2. Configure InsForge cloud instance (if available)
3. Update environment variables in production
4. Deploy functions via InsForge dashboard or CLI

## Step 5: Update Frontend

### 5.1 Test Locally

1. Start InsForge: `cd ../insforge && docker compose up` (in InsForge directory)
2. Start frontend: `npm run dev` (in your project)
3. Test all features that use API routes

### 5.2 Update Vercel Deployment

1. Add `VITE_INSFORGE_API_URL` to Vercel environment variables (if using InsForge in production)
2. Redeploy your frontend
3. Test production endpoints

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

1. Keep Vercel API routes working
2. Set up InsForge locally
3. Test InsForge endpoints locally
4. Switch frontend to use InsForge for local development
5. Deploy InsForge to production
6. Update production frontend to use InsForge
7. Remove Vercel API routes after verification

### Option 2: Complete Migration

1. Set up InsForge
2. Copy all functions and services
3. Deploy InsForge
4. Update frontend to use InsForge
5. Remove Vercel API routes

## Troubleshooting

### Functions Not Found

- Check function file paths match InsForge routing
- Verify functions are in correct directory structure
- Check InsForge logs: `docker compose logs`

### Import Errors

- Ensure service files are accessible from functions
- Check import paths in function files (should be relative to function location)
- Verify TypeScript compilation
- Check that `services/` and `src/` directories are in InsForge project root

### CORS Issues

- Check `ALLOWED_ORIGINS` in InsForge `.env`
- Verify CORS headers in function responses
- Check browser console for specific CORS errors
- Ensure frontend URL is in `ALLOWED_ORIGINS`

### API Key Errors

- Verify environment variables in InsForge `.env`
- Check function logs for specific API errors
- Ensure API keys have correct permissions
- Verify API keys are accessible via `process.env` in functions

### Environment Variable Access

InsForge functions use `process.env` to access environment variables. Make sure:
- Variables are set in InsForge `.env` file
- Variables are prefixed correctly (no `VITE_` prefix needed in backend)
- Restart InsForge after changing `.env`: `docker compose restart`

## File Structure

After migration, your InsForge project should look like:

```
insforge/
├── .env
├── docker-compose.yml
├── functions/
│   ├── curriculum/
│   │   ├── analyze.ts
│   │   └── analyze-stream.ts
│   ├── documents/
│   │   └── parse.ts
│   └── integrations/
│       └── gamma/
│           └── enhance.ts
├── services/          # Copied from teach-in-minutes
│   ├── ai/
│   ├── analysis/
│   └── ...
└── src/              # Copied from teach-in-minutes
    ├── types/
    └── ...
```

## Migration Checklist

- [ ] InsForge installed and running locally
- [ ] Environment variables configured in InsForge `.env`
- [ ] Function files copied to InsForge `functions/` directory
- [ ] Service files copied/linked to InsForge project
- [ ] Frontend API routes updated (automatic via config)
- [ ] Frontend `.env.local` updated with `VITE_INSFORGE_API_URL`
- [ ] Local testing successful
- [ ] InsForge deployed to production (if applicable)
- [ ] Production environment variables configured
- [ ] Vercel environment variables updated (if using InsForge in production)
- [ ] Production testing complete
- [ ] Vercel API routes removed (after verification)

## Testing

### Test Individual Endpoints

```bash
# Test document parsing
curl -X POST http://localhost:7131/api/documents/parse \
  -H "Content-Type: application/json" \
  -d '{"base64Data": "test", "mimeType": "image/png"}'

# Test curriculum analysis
curl -X POST http://localhost:7131/api/curriculum/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Test curriculum",
    "gradeLevel": "HIGH_SCHOOL",
    "standardsFramework": "COMMON_CORE"
  }'
```

### Use Test Script

```bash
./scripts/test-insforge-endpoints.sh
```

## Support

- InsForge Docs: https://docs.insforge.dev
- InsForge Discord: https://discord.com/invite/DvBtaEc
- GitHub Issues: https://github.com/InsForge/InsForge/issues

## Notes

- The frontend configuration automatically switches between Vercel and InsForge based on `VITE_INSFORGE_API_URL`
- You can test both backends by toggling the environment variable
- Keep Vercel API routes until InsForge is fully tested and deployed
- Service files need to be accessible to InsForge functions (copy or symlink)

