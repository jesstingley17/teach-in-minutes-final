# Gamma API Setup for Design Enhancement

Gamma API enables you to enhance your educational materials with AI-powered design, creating professional presentations and documents.

## Overview

Gamma API allows you to:
- Generate beautifully designed presentations from your educational content
- Create enhanced documents with professional layouts
- Export as PDF or PPTX
- Customize themes, tone, and visual style

## Setup

### 1. Account Requirements

You need a Gamma Pro, Ultra, Team, or Business account to access the API. API access is included with these subscription tiers at no additional cost.

### 2. Get Your API Key

1. Log in to [Gamma App](https://gamma.app)
2. Navigate to **Account Settings**
3. Go to the **API key** tab
4. Click **"Create API key"**
5. Copy the key (it will only be shown once)
6. Store it securely

### 3. Configure Environment Variable

Add your Gamma API key to your `.env.local` file:

```env
GAMMA_API_KEY=sk-gamma-your-api-key-here
```

**Important:** Never commit your API key to version control. Always use environment variables.

## Usage

The Gamma API service is available as an optional enhancement feature. When enabled, it can:

1. **Generate Presentations**: Convert your educational content into visually appealing presentations
2. **Enhance Documents**: Create professionally designed document layouts
3. **Export Options**: Download as PDF or PPTX

### API Endpoint

- **Base URL**: `https://public-api.gamma.app/v1.0/generations`
- **Authentication**: `X-API-KEY` header
- **Method**: POST

### Rate Limits

Gamma offers generous rate limits:
- Hundreds of requests per hour
- Thousands of requests per day
- Contact support for higher capacity if needed

## Integration

The Gamma service is integrated into ReclaimEdU's service layer. You can use it programmatically:

```typescript
import { generatePresentation, generateEnhancedDocument } from './services/gammaService';

// Generate a presentation
const result = await generatePresentation(
  'Your educational content here',
  'Worksheet Title',
  {
    tone: 'educational',
    audience: 'students',
    amount: 'standard'
  }
);

// Access the generated presentation URL
console.log('Presentation URL:', result.url);
```

## Features

- **Multiple Formats**: Presentations and documents
- **Customizable Themes**: Apply pre-created themes from your Gamma account
- **Text Options**: Control tone, audience, language, and detail level
- **Image Options**: AI-generated images, Unsplash, or none
- **Export Formats**: PDF and PPTX export available

## Documentation

For detailed API documentation, visit:
- [Gamma API Documentation](https://developers.gamma.app)
- [Gamma API Changelog](https://developers.gamma.app/changelog)

## Notes

- API v1.0 is generally available as of November 5, 2025
- API v0.2 will be deprecated on January 16, 2026
- Always use the latest API version (v1.0)






