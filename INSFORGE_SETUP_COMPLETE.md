# InsForge Setup Complete! ✅

Your InsForge migration has been successfully set up. Here's what was done:

## ✅ Completed Steps

1. **InsForge Cloned** - Located at `/Users/jessica-leetingley/Documents/insforge`
2. **Function Files Copied** - All 4 serverless functions are in place
3. **Service Files Copied** - `services/` directory copied to InsForge
4. **Source Files Copied** - `src/` directory copied to InsForge
5. **Utils Copied** - `utils/` directory copied to InsForge
6. **Environment Configured** - `.env` file set up with template variables
7. **Frontend Configured** - `.env.local` created with InsForge API URL

## 📁 File Structure

```
/Users/jessica-leetingley/Documents/insforge/
├── functions/
│   ├── curriculum/
│   │   ├── analyze.ts ✅
│   │   └── analyze-stream.ts ✅
│   ├── documents/
│   │   └── parse.ts ✅
│   └── integrations/
│       └── gamma/
│           └── enhance.ts ✅
├── services/ ✅ (copied from your project)
├── src/ ✅ (copied from your project)
├── utils/ ✅ (copied from your project)
└── .env ✅ (configured with template)
```

## 🔑 Next Steps - Add Your API Keys

### 1. Edit InsForge .env File

Open `/Users/jessica-leetingley/Documents/insforge/.env` and add your API keys:

```bash
# Required
GEMINI_API_KEY=your_actual_gemini_api_key_here
GAMMA_API_KEY=your_actual_gamma_api_key_here

# Optional
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Also update:
- `JWT_SECRET` - Generate a secure 32+ character secret
- `ADMIN_PASSWORD` - Change from default
- `ACCESS_API_KEY` - Generate or use default

### 2. Start InsForge

```bash
cd /Users/jessica-leetingley/Documents/insforge
docker compose up
```

Wait for services to start. You should see:
- InsForge API running on `http://localhost:7130`
- Dashboard available (check docker logs for exact URL)

### 3. Test the Setup

From your project directory:

```bash
cd /Users/jessica-leetingley/Documents/teach-in-minutes-final/teach-in-minutes-final
./scripts/test-insforge-endpoints.sh
```

### 4. Start Your Frontend

```bash
cd /Users/jessica-leetingley/Documents/teach-in-minutes-final/teach-in-minutes-final
npm run dev
```

Your frontend will now use InsForge backend at `http://localhost:7130/api`

## 🔍 Verification Checklist

- [ ] API keys added to InsForge `.env`
- [ ] InsForge started with `docker compose up`
- [ ] Test script runs successfully
- [ ] Frontend connects to InsForge
- [ ] API endpoints respond correctly

## 📝 Important Notes

1. **Port Configuration**: InsForge runs on port `7130` by default (not 7131)
2. **API URL**: Frontend is configured to use `http://localhost:7130/api`
3. **Environment Variables**: API keys in InsForge `.env` don't need `VITE_` prefix
4. **CORS**: Frontend URL is already added to `ALLOWED_ORIGINS`

## 🐛 Troubleshooting

### InsForge won't start
- Check Docker is running: `docker ps`
- Check port 7130 is available
- Review logs: `docker compose logs`

### Functions not found
- Verify function files are in `functions/` directory
- Check import paths in function files
- Ensure `services/` and `src/` are in InsForge root

### API key errors
- Verify keys are in InsForge `.env` (not frontend `.env.local`)
- Restart InsForge after changing `.env`: `docker compose restart`
- Check keys don't have extra spaces or quotes

### CORS errors
- Verify frontend URL in `ALLOWED_ORIGINS` in InsForge `.env`
- Check browser console for specific CORS errors

## 📚 Documentation

- Full migration guide: `INSFORGE_MIGRATION.md`
- Environment template: `INSFORGE_ENV_TEMPLATE.md`
- Function documentation: `insforge-functions/README.md`

## 🎉 You're Ready!

Once you add your API keys and start InsForge, you're all set! The frontend will automatically use InsForge when it's running.

