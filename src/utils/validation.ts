/**
 * Validation utilities
 */

import { UPLOAD_LIMITS, CURRICULUM_DEFAULTS } from '../constants';
import { GradeLevel, StandardsFramework } from '../types';

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not supported. Allowed types: ${UPLOAD_LIMITS.ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate curriculum text
 */
export function validateCurriculumText(text: string): {
  valid: boolean;
  error?: string;
  truncated?: string;
} {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: 'Curriculum text cannot be empty',
    };
  }

  if (text.length > CURRICULUM_DEFAULTS.MAX_TEXT_LENGTH) {
    return {
      valid: true,
      truncated: text.substring(0, CURRICULUM_DEFAULTS.MAX_TEXT_LENGTH),
    };
  }

  return { valid: true };
}

/**
 * Validate grade level
 */
export function validateGradeLevel(
  gradeLevel: string
): gradeLevel is GradeLevel {
  return Object.values(GradeLevel).includes(gradeLevel as GradeLevel);
}

/**
 * Validate standards framework
 */
export function validateStandardsFramework(
  framework: string
): framework is StandardsFramework {
  return Object.values(StandardsFramework).includes(
    framework as StandardsFramework
  );
}

/**
 * Sanitize base64 data (remove data URL prefix)
 */
export function sanitizeBase64(base64Data: string): string {
  if (base64Data.includes(',')) {
    return base64Data.split(',')[1];
  }
  return base64Data;
}

