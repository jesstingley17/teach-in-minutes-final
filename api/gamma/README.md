# Gamma API Serverless Function

This serverless function proxies Gamma API requests to avoid CORS issues and keep API keys secure on the server.

## Setup

1. **Environment Variable**: Add `GAMMA_API_KEY` to your Vercel project environment variables
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `GAMMA_API_KEY` with your Gamma API key value
   - Make sure it's available for Production, Preview, and Development environments

2. **Deploy**: The API route will be automatically deployed when you push to Vercel

## Usage

The client-side code calls `/api/gamma/enhance` which proxies the request to Gamma's API.

## Troubleshooting

- **"Failed to fetch"**: Usually means CORS or network issue. The serverless function should resolve this.
- **"GAMMA_API_KEY is not configured"**: Make sure the environment variable is set in Vercel
- **404 on /api/gamma/enhance**: Make sure the file is deployed and the route is accessible

