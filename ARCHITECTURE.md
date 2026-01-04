# Architecture & Code Organization

This document describes the improved code organization and structure of the application.

## Directory Structure

```
teach-in-minutes-final/
├── api/                          # API routes (Vercel serverless functions)
│   ├── curriculum/               # Curriculum analysis endpoints
│   │   ├── analyze.ts           # Comprehensive analysis
│   │   └── analyze-stream.ts    # Streaming analysis (SSE)
│   ├── documents/               # Document processing endpoints
│   │   └── parse.ts             # Document parsing
│   ├── generation/              # Content generation endpoints
│   └── integrations/            # Third-party integrations
│       └── gamma/               # Gamma API integration
│           └── enhance.ts
│
├── src/                          # Source code
│   ├── types/                    # TypeScript type definitions
│   │   ├── enums.ts             # All enumerations
│   │   ├── curriculum.ts        # Curriculum-related types
│   │   ├── instructional.ts     # Instructional suite types
│   │   ├── common.ts            # Shared/common types
│   │   └── index.ts             # Central type exports
│   ├── config/                  # Configuration files
│   │   ├── apiRoutes.ts         # API route constants
│   │   └── index.ts             # Config exports
│   ├── constants/               # Application constants
│   │   └── index.ts             # Storage keys, feature flags, etc.
│   └── utils/                   # Utility functions
│       ├── apiClient.ts         # HTTP client with retries
│       ├── validation.ts        # Validation utilities
│       └── index.ts             # Utility exports
│
├── services/                     # Business logic services
│   ├── ai/                      # AI provider services
│   │   ├── aiService.ts         # Multi-provider orchestration
│   │   ├── geminiService.ts     # Google Gemini
│   │   ├── openaiService.ts     # OpenAI
│   │   └── claudeService.ts     # Anthropic Claude
│   ├── analysis/                # Analysis services
│   │   ├── curriculumAnalysisService.ts
│   │   ├── curriculumAnalysisStreamService.ts
│   │   └── standardsService.ts
│   ├── integrations/            # Third-party integrations
│   │   ├── gammaService.ts
│   │   ├── adobeService.ts
│   │   └── adobeCreativeService.ts
│   └── ...                      # Other services
│
├── hooks/                        # React hooks
│   └── useCurriculumAnalysis.ts
│
├── supabase/                     # Database schemas
│   ├── schema.sql               # Main schema
│   ├── parsed_curriculums_schema.sql
│   ├── user_settings_schema.sql
│   └── index.ts                 # Schema documentation
│
└── types.ts                      # Backward compatibility (re-exports)
```

## Type Organization

Types are now organized by domain:

- **`src/types/enums.ts`**: All enumerations (BloomLevel, GradeLevel, etc.)
- **`src/types/curriculum.ts`**: Curriculum analysis types
- **`src/types/instructional.ts`**: Instructional suite and material types
- **`src/types/common.ts`**: Shared/common types
- **`src/types/index.ts`**: Central export point

### Usage

```typescript
// Import from organized structure
import { CurriculumNode, GradeLevel } from './src/types';

// Or use backward-compatible import
import { CurriculumNode, GradeLevel } from './types';
```

## API Routes

API routes are organized by functionality:

- **`/api/curriculum/*`**: Curriculum analysis endpoints
- **`/api/documents/*`**: Document processing endpoints
- **`/api/generation/*`**: Content generation endpoints
- **`/api/integrations/*`**: Third-party integrations

### API Route Constants

Use the centralized route constants:

```typescript
import { API_ROUTES } from './src/config';

// Use constants instead of hardcoded strings
const response = await fetch(API_ROUTES.DOCUMENTS.PARSE, {
  method: 'POST',
  body: JSON.stringify(data)
});
```

## Service Organization

Services are organized by category:

- **`services/ai/`**: AI provider services (Gemini, OpenAI, Claude)
- **`services/analysis/`**: Analysis and processing services
- **`services/integrations/`**: Third-party service integrations
- **`services/utils/`**: Utility services

## Utilities

### API Client (`src/utils/apiClient.ts`)

Enhanced HTTP client with:
- Automatic retries
- Timeout handling
- Error handling
- Type safety
- Streaming support (SSE)

```typescript
import { apiPost, apiGet, apiStream } from './src/utils';

// Type-safe POST request
const result = await apiPost<ResponseType>(API_ROUTES.DOCUMENTS.PARSE, data);

// Streaming request
for await (const chunk of apiStream(API_ROUTES.CURRICULUM.ANALYZE_STREAM, data)) {
  // Handle streaming chunks
}
```

### Validation (`src/utils/validation.ts`)

Validation utilities for:
- File uploads
- Curriculum text
- Grade levels
- Standards frameworks

```typescript
import { validateFileUpload, validateCurriculumText } from './src/utils';

const validation = validateFileUpload(file);
if (!validation.valid) {
  alert(validation.error);
}
```

## Constants

Application-wide constants in `src/constants/index.ts`:

- **`STORAGE_KEYS`**: LocalStorage keys
- **`FEATURE_FLAGS`**: Feature toggles
- **`API_CONFIG`**: API configuration (timeouts, retries)
- **`UPLOAD_LIMITS`**: File upload constraints
- **`CURRICULUM_DEFAULTS`**: Default curriculum settings
- **`GENERATION_DEFAULTS`**: Default generation settings

## Database Schemas

Schemas are documented in `supabase/index.ts`:

- **`schema.sql`**: Main instructional suites table
- **`parsed_curriculums_schema.sql`**: Curriculum parsing results
- **`user_settings_schema.sql`**: User preferences

## Benefits of New Structure

1. **Better Organization**: Related code is grouped together
2. **Easier Navigation**: Clear folder structure makes finding files easier
3. **Scalability**: Easy to add new features without cluttering
4. **Type Safety**: Organized types make imports cleaner
5. **Maintainability**: Clear separation of concerns
6. **Reusability**: Centralized utilities and constants
7. **Error Handling**: Consistent error handling patterns
8. **Validation**: Centralized validation logic

## Migration Notes

- Old imports from `./types` still work (backward compatible)
- API routes have moved to organized folders
- Use `API_ROUTES` constants instead of hardcoded URLs
- Use `apiPost`, `apiGet`, `apiStream` instead of raw `fetch`
- Use validation utilities instead of inline validation
- New code should import from `src/types` directly
- Services are organized by category in subdirectories
