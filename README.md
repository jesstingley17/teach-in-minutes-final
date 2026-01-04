<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1smb3LjYfxEFYK_JIiHHLLZtWEc3Aia5L

## Run Locally

**Prerequisites:**  Node.js

### Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API keys:
   ```bash
   cp .env.example .env.local
   ```
   
   **Minimum setup (free):**
   - `GEMINI_API_KEY` - Required for core functionality and image generation
   - `SUPABASE_URL` + `SUPABASE_ANON_KEY` - Optional, for cloud storage
   
   **Recommended for production:**
   - `GEMINI_API_KEY` - Primary content generation
   - `OPENAI_API_KEY` - Fallback and reliability
   - `ANTHROPIC_API_KEY` - Safety audits and quality enhancement
   - `SUPABASE_URL` + `SUPABASE_ANON_KEY` - Cloud storage and authentication
   
   **Optional enhancements:**
   - `GAMMA_API_KEY` - AI-powered presentations
   - `ADOBE_CLIENT_ID` + other Adobe credentials - Professional PDF services
   
   **Need help choosing?** See [API_SELECTION_GUIDE.md](API_SELECTION_GUIDE.md) for detailed recommendations.

3. Run the app:
   ```bash
   npm run dev
   ```

### Setup Guides

- 📘 [API Selection Guide](API_SELECTION_GUIDE.md) - **Start here!** Choose which APIs to use
- 🔧 [Multi-Provider Setup](MULTI_PROVIDER_SETUP.md) - Configure Gemini, OpenAI, Claude, Gamma
- 💾 [Supabase Setup](SUPABASE_SETUP.md) - Cloud storage and authentication
- 📄 [Adobe PDF Services Setup](ADOBE_SETUP.md) - Professional PDF features
- 🎨 [Gamma Design Enhancement Setup](GAMMA_SETUP.md) - Presentation generation
