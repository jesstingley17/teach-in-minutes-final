# Multi-Provider AI Setup

ReclaimEdU now supports multiple AI providers for enhanced reliability, flexibility, and quality!

## Supported Providers

1. **Google Gemini** (Recommended - Default)
   - Best for: Multimodal analysis, image generation, comprehensive content
   - Models: Gemini 3 Pro, Gemini 2.5 Flash Image, Gemini 2.0 Flash

2. **OpenAI GPT-4o**
   - Best for: High-quality text generation, reliable performance
   - Models: GPT-4o

3. **Anthropic Claude**
   - Best for: Long-form content, nuanced educational materials
   - Models: Claude 3.5 Sonnet

## Setup

### Environment Variables

Add API keys to your `.env.local` file:

```env
# Google Gemini (Required for image generation/doodles)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI (Optional - for GPT-4o)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic (Optional - for Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Getting API Keys

#### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and add to `.env.local`

#### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and add to `.env.local`

#### Anthropic Claude
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Copy and add to `.env.local`

## How It Works

### Provider Selection
- The app automatically detects which providers are configured
- You can select a preferred provider in the Generation Settings
- If the selected provider fails, the app automatically falls back to other available providers

### Fallback Logic
- Primary: Uses your selected provider
- Secondary: Falls back to other available providers if primary fails
- Error Handling: Only fails if ALL providers fail

### Best Practices

1. **Start with Gemini**: Gemini is recommended as it has the best multimodal capabilities (especially for document/image analysis and doodle generation)

2. **Add OpenAI for Reliability**: OpenAI provides excellent fallback reliability and high-quality text generation

3. **Add Claude for Quality**: Claude excels at long-form, nuanced educational content

4. **Multiple Providers**: Having multiple providers ensures maximum reliability and quality

## Features by Provider

| Feature | Gemini | OpenAI | Claude |
|---------|--------|--------|--------|
| Curriculum Analysis | ✅ | ✅ | ✅ |
| Document Analysis (PDF/Image) | ✅ | ✅ | ✅ |
| Suite Generation | ✅ | ✅ | ✅ |
| Image Generation (Doodles) | ✅ | ❌ | ❌ |
| Fast Chatbot | ✅ | ✅ | ✅ |

## Usage

1. Configure at least one API key (Gemini recommended)
2. Select your preferred provider in the Generation Settings
3. The app will automatically use your selection with fallback to others
4. Enjoy enhanced reliability and quality!

