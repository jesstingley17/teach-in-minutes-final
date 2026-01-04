# InsForge Environment Variables Template

Copy these to your InsForge project's `.env` file.

## Required Variables

```bash
# AI API Keys (Required)
GEMINI_API_KEY=your_gemini_api_key

# Integration API Keys (Required if using Gamma)
GAMMA_API_KEY=your_gamma_api_key
```

## Optional Variables

```bash
# AI API Keys (Optional - for multi-provider support)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Adobe PDF Services (Optional)
ADOBE_CLIENT_ID=your_adobe_client_id
ADOBE_CLIENT_SECRET=your_adobe_client_secret
ADOBE_ORGANIZATION_ID=your_adobe_organization_id
ADOBE_ACCOUNT_ID=your_adobe_account_id
ADOBE_PRIVATE_KEY=your_adobe_private_key
```

## Configuration

```bash
# Node Environment
NODE_ENV=development  # or 'production'

# CORS Configuration
# Add your frontend URLs (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-vercel-app.vercel.app
```

## Frontend Environment Variables

Add to your frontend `.env.local`:

```bash
# For local development with InsForge
VITE_INSFORGE_API_URL=http://localhost:7131/api

# For production (after deploying InsForge)
# VITE_INSFORGE_API_URL=https://your-insforge-instance.com/api
```

## Notes

- Variables in InsForge `.env` don't need `VITE_` prefix
- Frontend variables need `VITE_` prefix to be accessible in the browser
- Restart InsForge after changing `.env`: `docker compose restart`
- For Vercel deployment, add `VITE_INSFORGE_API_URL` to Vercel environment variables

