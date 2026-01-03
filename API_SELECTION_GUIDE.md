# API Selection Guide for Blueprint Pro

This guide helps you choose which APIs to configure for your Blueprint Pro deployment based on your needs, budget, and use cases.

## Quick Start (Minimum Setup)

**Required for basic functionality:**
- ✅ **Google Gemini API** - Required for core content generation and image generation

**Recommended additions:**
- ✅ **Supabase** - For cloud storage and multi-device sync (free tier available)

That's it! You can start using Blueprint Pro with just these two services.

---

## API Selection by Use Case

### 1. Individual Teacher / Small School (Free/Low Cost)

**APIs to configure:**
- ✅ Gemini API (free tier: generous limits)
- ✅ Supabase (free tier: unlimited projects)

**Total cost:** $0/month for moderate usage

**What you get:**
- Full content generation capabilities
- Image/doodle generation
- Cloud storage for your worksheets
- Multi-device access
- User authentication

---

### 2. Enhanced Reliability (Recommended for Production)

**APIs to configure:**
- ✅ Gemini API (primary)
- ✅ OpenAI API (fallback)
- ✅ Anthropic Claude API (quality check)
- ✅ Supabase

**Total cost:** ~$20-50/month depending on usage

**What you get:**
- All features from Individual setup
- Automatic fallback if one provider fails
- Higher quality content with Claude review
- Better reliability and uptime

**Why this setup:**
- Gemini: Best multimodal capabilities, handles images and documents
- OpenAI: Reliable fallback, excellent text generation
- Claude: Safety audits, long-form content, pedagogy checks

---

### 3. Professional/District Deployment (Full Features)

**APIs to configure:**
- ✅ Gemini API
- ✅ OpenAI API
- ✅ Anthropic Claude API
- ✅ Gamma API (presentations)
- ✅ Adobe PDF Services API (professional PDFs)
- ✅ Supabase

**Total cost:** ~$100-300/month depending on volume

**What you get:**
- Everything from Enhanced Reliability
- AI-powered presentation generation
- Professional PDF generation and compression
- Enhanced document layouts
- Export to PPTX format

**Best for:**
- School districts
- EdTech companies
- Content creation teams
- Professional development organizations

---

## Detailed API Comparison

### Content Generation APIs

| Provider | Best For | Cost | Strengths | Limitations |
|----------|----------|------|-----------|-------------|
| **Gemini** | Primary generation | Free tier generous | • Multimodal (text + images)<br>• Image generation<br>• Fast response<br>• Cost-effective | • Different rate limits from other providers |
| **OpenAI** | Reliable fallback | ~$0.01-0.03/1K tokens | • Highly reliable<br>• Excellent text quality<br>• Well-documented | • No native image generation<br>• Higher cost |
| **Claude** | Quality & safety | ~$0.015/1K tokens | • Long context (200K tokens)<br>• Safety auditing<br>• Nuanced content | • No image generation<br>• Higher cost for input |

### Design & Enhancement Services

| Service | Purpose | Cost | When to Use |
|---------|---------|------|-------------|
| **Gamma** | Presentations | Included with Pro subscription ($15/mo) | • Need professional presentations<br>• Export to PPTX<br>• Design enhancement |
| **Adobe PDF** | Professional PDFs | 1,000 free transactions/month | • High-quality PDFs<br>• PDF compression<br>• PDF merging |

### Storage & Authentication

| Service | Purpose | Free Tier | Paid Plans |
|---------|---------|-----------|------------|
| **Supabase** | Cloud storage, auth | Unlimited projects, 500MB DB | $25/mo for Pro |

---

## Feature Matrix

See which APIs enable which features:

| Feature | Gemini | OpenAI | Claude | Gamma | Adobe | Supabase |
|---------|--------|--------|--------|-------|-------|----------|
| Generate worksheets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analyze curriculum documents | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate images/doodles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Safety audits | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Content summarization | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Provider fallback | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate presentations | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Enhanced PDF export | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| PDF compression | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Cloud storage | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| User authentication | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-device sync | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Cost Optimization Tips

### For Individual Teachers
1. Start with **Gemini only** (free tier)
2. Add **Supabase** for cloud backup (free tier)
3. Monitor your usage monthly
4. Upgrade to paid tiers only when needed

### For Schools/Districts
1. Configure **all three AI providers** for reliability
2. Use **Gemini as primary** (most cost-effective)
3. Use **OpenAI as fallback** (moderate cost, high reliability)
4. Use **Claude for safety audits** (higher quality, worth the cost)
5. Add **Gamma** if creating presentations regularly
6. Add **Adobe** only if professional PDF features are essential

### Usage Estimates

**Light usage** (5-10 worksheets/day):
- Gemini free tier sufficient
- Supabase free tier sufficient
- Total: $0/month

**Moderate usage** (20-50 worksheets/day):
- Gemini: ~$10/month
- OpenAI (if used): ~$10-20/month
- Supabase free tier sufficient
- Total: ~$10-30/month

**Heavy usage** (100+ worksheets/day):
- Gemini: ~$30-50/month
- OpenAI: ~$30-50/month
- Claude: ~$20-40/month
- Gamma: $15-30/month (subscription)
- Adobe: Free tier likely sufficient
- Supabase: May need Pro ($25/month)
- Total: ~$120-195/month

---

## Setup Instructions

### Priority Order

Set up APIs in this order for the best experience:

1. **Gemini** - Start here, get basic functionality working
2. **Supabase** - Add cloud storage next
3. **OpenAI** - Add for reliability
4. **Claude** - Add for quality enhancement
5. **Gamma** - Optional, for presentations
6. **Adobe** - Optional, for professional PDFs

### Configuration Steps

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Follow the setup guides:
   - [Multi-Provider Setup](MULTI_PROVIDER_SETUP.md) - For Gemini, OpenAI, Claude, Gamma
   - [Supabase Setup](SUPABASE_SETUP.md) - For cloud storage
   - [Adobe Setup](ADOBE_SETUP.md) - For Adobe PDF Services
   - [Gamma Setup](GAMMA_SETUP.md) - For design enhancement

3. Add your API keys to `.env.local`

4. Test the application:
   ```bash
   npm run dev
   ```

5. Check Settings > API Status to verify configuration

---

## FAQ

### Q: Which AI provider should I choose as my primary?

**A:** Gemini is recommended as the primary provider because:
- Free tier is very generous
- Supports multimodal (text + images)
- Can generate doodles and educational images
- Fast response times
- Good quality output

### Q: Do I need all three AI providers?

**A:** No. You can start with just Gemini. Add OpenAI and Claude later for:
- Reliability (automatic fallback)
- Quality enhancement (Claude's safety audits)
- Specialized features (Claude excels at long-form content)

### Q: Is Supabase required?

**A:** No. The app works without Supabase using browser localStorage. However, Supabase provides:
- Cloud backup of your work
- Multi-device access
- User authentication
- Better scalability

The free tier is generous, so we recommend adding it.

### Q: When should I add Gamma?

**A:** Add Gamma if you:
- Create presentations regularly
- Need professional design layouts
- Want to export to PPTX format
- Have a Gamma Pro/Ultra/Team/Business subscription

### Q: When should I add Adobe PDF Services?

**A:** Add Adobe if you:
- Need professional-quality PDFs
- Require PDF compression
- Need to merge multiple PDFs
- Want password-protected PDFs
- Have high-volume PDF generation needs

### Q: Can I use the app offline?

**A:** Partially. You can:
- ✅ View saved worksheets (stored in browser)
- ✅ Export to PDF (using built-in jsPDF)
- ❌ Generate new content (requires API connection)
- ❌ Generate images (requires Gemini)

### Q: What happens if an API fails?

**A:** The app has automatic fallback logic:
1. Tries your selected provider first
2. Falls back to other configured providers
3. Shows a clear error if all providers fail
4. No data loss - drafts are saved locally

### Q: How do I monitor my API usage?

**A:** Check your provider dashboards:
- **Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/usage
- **Anthropic**: https://console.anthropic.com/
- **Gamma**: https://gamma.app/account
- **Adobe**: https://developer.adobe.com/console
- **Supabase**: https://supabase.com/dashboard

---

## Need Help?

- Review the detailed setup guides (linked above)
- Check the AI Blueprint document: [AI_BLUEPRINT.md](AI_BLUEPRINT.md)
- Review prompt templates: [AI_PROMPTS.md](AI_PROMPTS.md)
- Check provider documentation (links in setup guides)

---

## Summary Recommendations

### Minimum (Free)
- Gemini + Supabase
- **Cost:** $0/month
- **Best for:** Individual teachers, trying out the platform

### Recommended (Production)
- Gemini + OpenAI + Claude + Supabase
- **Cost:** ~$20-50/month
- **Best for:** Regular use, reliability matters, quality content

### Full Featured (Professional)
- All APIs configured
- **Cost:** ~$100-300/month
- **Best for:** School districts, content teams, high volume

Choose the setup that matches your needs and budget. You can always start small and add more APIs later!
