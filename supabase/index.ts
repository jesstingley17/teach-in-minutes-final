/**
 * Supabase Schema Index
 * Centralized exports for all database schemas
 */

// Note: SQL files are in the supabase/ directory
// This file serves as documentation for schema organization

export const SCHEMA_FILES = {
  MAIN: 'supabase/schema.sql', // instructional_suites table
  PARSED_CURRICULUMS: 'supabase/parsed_curriculums_schema.sql',
  USER_SETTINGS: 'supabase/user_settings_schema.sql',
} as const;

/**
 * Schema organization:
 * 
 * - schema.sql: Main instructional suites storage
 * - parsed_curriculums_schema.sql: Curriculum document parsing results
 * - user_settings_schema.sql: User preferences and settings
 */

