/**
 * API Route Constants
 * Centralized configuration for all API endpoints
 */

const API_BASE = '/api';

export const API_ROUTES = {
  // Curriculum Analysis
  CURRICULUM: {
    ANALYZE: `${API_BASE}/curriculum/analyze`,
    ANALYZE_STREAM: `${API_BASE}/curriculum/analyze/stream`,
    GAPS: `${API_BASE}/curriculum/gaps`,
    PREREQUISITES: `${API_BASE}/curriculum/prerequisites`,
    LEARNING_PATH: `${API_BASE}/curriculum/learning-path`,
  },

  // Document Processing
  DOCUMENTS: {
    PARSE: `${API_BASE}/documents/parse`,
    UPLOAD: `${API_BASE}/documents/upload`,
    ANALYZE: `${API_BASE}/documents/analyze`,
  },

  // Content Generation
  GENERATION: {
    SUITE: `${API_BASE}/generation/suite`,
    DOODLE: `${API_BASE}/generation/doodle`,
    DIAGRAM: `${API_BASE}/generation/diagram`,
    RUBRIC: `${API_BASE}/generation/rubric`,
  },

  // External Integrations
  INTEGRATIONS: {
    GAMMA: {
      ENHANCE: `${API_BASE}/integrations/gamma/enhance`,
    },
    ADOBE: {
      PDF: `${API_BASE}/integrations/adobe/pdf`,
    },
  },

  // Standards
  STANDARDS: {
    FETCH: `${API_BASE}/standards/fetch`,
    ALIGN: `${API_BASE}/standards/align`,
  },
} as const;

/**
 * Helper function to build API URLs
 */
export function buildApiUrl(route: string, params?: Record<string, string>): string {
  let url = route;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  return url;
}

/**
 * Type-safe API route getter
 */
export type ApiRoute = typeof API_ROUTES;

