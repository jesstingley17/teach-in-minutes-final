# InsForge Function Files

This directory contains the serverless function files for InsForge backend.

## Directory Structure

```
insforge-functions/
├── curriculum/
│   ├── analyze.ts          # Comprehensive curriculum analysis
│   └── analyze-stream.ts   # Streaming curriculum analysis (SSE)
├── documents/
│   └── parse.ts            # Document parsing (PDF, images)
└── integrations/
    └── gamma/
        └── enhance.ts      # Gamma API integration
```

## Installation

Copy these files to your InsForge project's `functions/` directory:

```bash
# From your teach-in-minutes project root
cp -r insforge-functions/* ../insforge/functions/
```

## Dependencies

These functions require:
- `services/` directory (from your project root)
- `src/` directory (from your project root)

Copy or symlink these directories to your InsForge project:

```bash
# Option 1: Copy (for production)
cp -r services ../insforge/
cp -r src ../insforge/

# Option 2: Symlink (for development)
cd ../insforge
ln -s ../teach-in-minutes-final/services services
ln -s ../teach-in-minutes-final/src src
```

## Environment Variables

Set these in your InsForge `.env` file:

- `GEMINI_API_KEY` - Required for curriculum analysis and document parsing
- `GAMMA_API_KEY` - Required for Gamma integration
- `OPENAI_API_KEY` - Optional, for multi-provider support
- `ANTHROPIC_API_KEY` - Optional, for multi-provider support
- `NODE_ENV` - Set to `development` or `production`

## Testing

After copying files and setting up dependencies:

1. Start InsForge: `cd ../insforge && docker compose up`
2. Test endpoints: `./scripts/test-insforge-endpoints.sh`

## Function Details

### curriculum/analyze.ts
- **Endpoint**: `/api/curriculum/analyze`
- **Method**: POST
- **Body**: `{ rawText, gradeLevel, standardsFramework }`
- **Returns**: Comprehensive curriculum analysis

### curriculum/analyze-stream.ts
- **Endpoint**: `/api/curriculum/analyze-stream`
- **Method**: POST
- **Body**: `{ rawText, gradeLevel, standardsFramework }`
- **Returns**: Server-Sent Events stream of analysis progress

### documents/parse.ts
- **Endpoint**: `/api/documents/parse`
- **Method**: POST
- **Body**: `{ base64Data, mimeType, gradeLevel?, standardsFramework? }`
- **Returns**: Array of curriculum nodes parsed from document

### integrations/gamma/enhance.ts
- **Endpoint**: `/api/integrations/gamma/enhance`
- **Method**: POST
- **Body**: `{ content, title, format?, options? }`
- **Returns**: Gamma document generation result

## Troubleshooting

### Import Errors
- Ensure `services/` and `src/` directories are in InsForge project root
- Check import paths in function files are relative to function location
- Verify TypeScript can resolve the imports

### API Key Errors
- Check environment variables are set in InsForge `.env`
- Restart InsForge after changing `.env`: `docker compose restart`
- Verify API keys are accessible via `process.env` in functions

### CORS Issues
- Add your frontend URL to `ALLOWED_ORIGINS` in InsForge `.env`
- Check CORS headers in function responses

