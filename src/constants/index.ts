/**
 * Application-wide constants
 */

// Storage keys
export const STORAGE_KEYS = {
  DRAFTS: 'blueprint_pro_drafts_v1',
  USER_PREFERENCES: 'user_preferences_v1',
  CURRICULUM_CACHE: 'curriculum_cache_v1',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  USE_SUPABASE: !!(import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY),
  ENABLE_STREAMING: true,
  ENABLE_CACHING: true,
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
  ],
} as const;

// Curriculum analysis defaults
export const CURRICULUM_DEFAULTS = {
  MAX_TEXT_LENGTH: 15000,
  DEFAULT_GRADE_LEVEL: 'GRADE_5' as const,
  DEFAULT_STANDARDS_FRAMEWORK: 'COMMON_CORE_MATH' as const,
} as const;

// Generation defaults
export const GENERATION_DEFAULTS = {
  DEFAULT_PAGE_COUNT: 1,
  DEFAULT_BLOOM_LEVEL: 'APPLICATION' as const,
  DEFAULT_DIFFERENTIATION: 'GENERAL' as const,
  DEFAULT_AESTHETIC: 'MODERN' as const,
} as const;

