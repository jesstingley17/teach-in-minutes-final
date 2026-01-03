# Adobe PDF Services API & Creative SDK Setup

This guide will help you set up Adobe PDF Services API and Adobe Creative SDK integration for enhanced PDF generation and design capabilities.

## Overview

The integration provides:
- **Adobe PDF Services API**: Enhanced PDF generation, compression, merging, and text extraction
- **Adobe Creative SDK**: Access to design assets, templates, and color palettes

## Prerequisites

1. Adobe Developer Account (free tier available)
2. Access to Adobe Developer Console
3. OAuth Server-to-Server credentials

## Setup Steps

### 1. Create Adobe Developer Account

1. Go to [Adobe Developer Console](https://developer.adobe.com/console)
2. Sign in with your Adobe ID (or create one)
3. Create a new project or use an existing one

### 2. Set Up OAuth Server-to-Server Credentials

1. In your Adobe Developer Console project, go to **Credentials**
2. Click **Create New Credential** → **OAuth Server-to-Server**
3. Fill in the credential details:
   - **Credential Name**: `PDF Services API`
   - **Product Profile**: Select "PDF Services API"
   - **Description**: (Optional) Description of your integration
4. Click **Create Credential**
5. **Important**: Copy the following values (they're only shown once):
   - Client ID (API Key)
   - Client Secret
   - Organization ID
   - Account ID
   - Private Key (download the JSON file)

### 3. Configure Environment Variables

#### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables (for Production, Preview, and Development as needed):

```
ADOBE_CLIENT_ID=your_client_id_here
ADOBE_CLIENT_SECRET=your_client_secret_here
ADOBE_ORGANIZATION_ID=your_organization_id_here
ADOBE_ACCOUNT_ID=your_account_id_here
ADOBE_PRIVATE_KEY=your_private_key_here
```

4. **Important**: After adding variables, redeploy your application for changes to take effect.

#### For Local Development:

Add the following to your `.env.local` file:

```env
# Adobe PDF Services API Credentials
ADOBE_CLIENT_ID=your_client_id_here
ADOBE_CLIENT_SECRET=your_client_secret_here
ADOBE_ORGANIZATION_ID=your_organization_id_here
ADOBE_ACCOUNT_ID=your_account_id_here
ADOBE_PRIVATE_KEY=your_private_key_here
```

**Security Note**: Never commit these credentials to version control. Always use environment variables.

### 4. Install Dependencies (if needed)

The integration uses standard fetch API, so no additional npm packages are required. However, if you want to use the Adobe SDK directly:

```bash
npm install @adobe/pdfservices-node-sdk
```

## Usage

### Basic PDF Export with Adobe

The PDF service will automatically use Adobe PDF Services if credentials are configured:

```typescript
import { PDFService } from './services/pdfService';

// Export with Adobe (if configured) or fallback to jsPDF
await PDFService.exportToPDFWithAdobe(suite, true);
```

### Using Adobe PDF Services Directly

```typescript
import { createPDFFromHTML, compressPDF, mergePDFs } from './services/adobeService';

// Create PDF from HTML
const result = await createPDFFromHTML(htmlContent, {
  compress: true,
  linearize: true
});

// Compress existing PDF
const compressed = await compressPDF(pdfFile, 'high');

// Merge multiple PDFs
const merged = await mergePDFs([pdf1, pdf2, pdf3]);
```

### Using Adobe Creative SDK

```typescript
import { 
  searchAdobeStock, 
  getEducationalTemplates,
  getDesignSuggestions 
} from './services/adobeCreativeService';

// Search for educational images
const images = await searchAdobeStock({
  query: 'math worksheet',
  type: 'image',
  limit: 20
});

// Get educational templates
const templates = await getEducationalTemplates('worksheet');

// Get design suggestions
const suggestions = await getDesignSuggestions('worksheet', 'Grade 5');
```

## Features

### PDF Services API

- ✅ **HTML to PDF**: Convert HTML content to high-quality PDFs
- ✅ **PDF Compression**: Reduce file size while maintaining quality
- ✅ **PDF Merging**: Combine multiple PDFs into one
- ✅ **Text Extraction**: Extract text from PDF documents
- ✅ **Password Protection**: Add password and permissions to PDFs

### Creative SDK

- ✅ **Stock Search**: Search Adobe Stock for images and templates
- ✅ **Educational Templates**: Get pre-designed educational templates
- ✅ **Color Palettes**: Access educational color schemes
- ✅ **Design Suggestions**: Get AI-powered design recommendations

## API Limits

Adobe provides generous free tier limits:
- **PDF Services**: 1,000 transactions/month (free tier)
- **Stock API**: Varies by subscription
- **Rate Limits**: Check your Adobe Developer Console for specific limits

## Troubleshooting

### Authentication Errors

If you see authentication errors:
1. Verify all environment variables are set correctly
2. Check that your credentials haven't expired
3. Ensure your OAuth Server-to-Server credential is active
4. Verify the product profile includes "PDF Services API"

### PDF Generation Fails

If PDF generation fails:
1. Check browser console for specific error messages
2. Verify your HTML content is valid
3. Check Adobe service status
4. The service will automatically fall back to jsPDF if Adobe fails

### Rate Limit Errors

If you hit rate limits:
1. Check your usage in Adobe Developer Console
2. Consider upgrading your plan
3. Implement request throttling in your application

## Documentation

- [Adobe PDF Services API](https://developer.adobe.com/document-services/docs/overview/pdf-services-api/)
- [Adobe Authentication Guide](https://developer.adobe.com/developer-console/docs/guides/authentication/)
- [Adobe Stock API](https://developer.adobe.com/stock/docs/)
- [Adobe Creative SDK](https://developer.adobe.com/creative-cloud/)

## Support

For issues with:
- **Adobe Services**: Contact Adobe Developer Support
- **Integration**: Check the code comments in `services/adobeService.ts` and `services/adobeCreativeService.ts`

