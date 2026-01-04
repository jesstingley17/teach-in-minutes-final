# InsForge Setup (Optional)

InsForge has been set up as an **optional** backend alternative to your current Supabase + Vercel setup.

## Current Setup (Active)

✅ **Supabase** - Database, Authentication, Storage  
✅ **Vercel** - Frontend hosting + API routes (serverless functions)

## InsForge Setup (Optional - Ready for Future Use)

The InsForge migration has been completed and is ready to use if you ever want to switch:

- ✅ InsForge cloned at `/Users/jessica-leetingley/Documents/insforge`
- ✅ Function files copied and ready
- ✅ Service files copied
- ✅ Frontend configured to support both backends

## How to Use InsForge (If Needed Later)

### Option 1: Keep Using Supabase + Vercel (Current - Recommended)
- No changes needed
- Everything works as-is
- `.env.local` has InsForge URL commented out

### Option 2: Switch to InsForge (Future)
1. Add API keys to `/Users/jessica-leetingley/Documents/insforge/.env`
2. Start InsForge: `cd ../insforge && docker compose up`
3. Uncomment in `.env.local`: `VITE_INSFORGE_API_URL=http://localhost:7130/api`
4. Restart frontend

## Frontend Configuration

The frontend automatically detects which backend to use:

- **If `VITE_INSFORGE_API_URL` is set** → Uses InsForge
- **If `VITE_INSFORGE_API_URL` is not set** → Uses Vercel API routes (current)

This means you can switch between backends just by commenting/uncommenting one line in `.env.local`.

## Files Ready for Use

All InsForge files are ready:
- `insforge-functions/` - Function templates in your project
- `scripts/` - Setup and testing scripts
- `INSFORGE_MIGRATION.md` - Complete migration guide
- InsForge project at `/Users/jessica-leetingley/Documents/insforge`

## Recommendation

**Keep using Supabase + Vercel** - it's working well and you have everything you need. InsForge is there if you ever want to explore it or need its specific features.

No action needed - your app will continue working exactly as it does now! 🎉

