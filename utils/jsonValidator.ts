/**
 * JSON Validation and Retry Utilities
 * Implements strict JSON schema validation with retry logic as per AI_BLUEPRINT.md
 */

export interface ValidationResult {
  valid: boolean;
  data?: any;
  error?: string;
  needsRetry?: boolean;
}

/**
 * Attempt to parse JSON with error handling
 * Handles both string and already-parsed object inputs
 */
export function parseJSON(text: string | any): ValidationResult {
  try {
    // If it's already an object/array, return it directly
    if (typeof text !== 'string') {
      if (text && (typeof text === 'object' || Array.isArray(text))) {
        return { valid: true, data: text };
      }
      // If it's not a string and not an object, convert to string
      text = String(text);
    }
    
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON object/array in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleaned);
    return { valid: true, data: parsed };
  } catch (error: any) {
    // Extract position information from error message if available
    let errorMessage = error.message || 'Invalid JSON';
    
    // Try to extract position from error message (e.g., "at position 64931")
    const positionMatch = errorMessage.match(/position (\d+)/);
    if (positionMatch) {
      const position = parseInt(positionMatch[1]);
      const start = Math.max(0, position - 200);
      const end = Math.min(text.length, position + 200);
      const context = text.substring(start, end);
      
      // Try to identify common issues
      if (context.includes('"') && !context.match(/"[^"]*":/)) {
        errorMessage += ' (Possible unescaped quote in string value)';
      } else if (context.includes("'")) {
        errorMessage += ' (Possible use of single quotes instead of double quotes)';
      } else if (context.match(/,\s*[,}]/)) {
        errorMessage += ' (Possible trailing comma)';
      }
      
      errorMessage += `\nContext around error position: ...${context}...`;
    }
    
    return {
      valid: false,
      error: errorMessage,
      needsRetry: true
    };
  }
}

/**
 * Validate that parsed JSON has required fields
 */
export function validateSchema(data: any, requiredFields: string[]): ValidationResult {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'Data is not an object',
      needsRetry: true
    };
  }

  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!(field in data)) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      needsRetry: true
    };
  }

  return { valid: true, data };
}

/**
 * Generate retry prompt for invalid JSON
 */
export function generateRetryPrompt(originalResponse: string, schema?: string): string {
  let retry = "The previous response was invalid JSON. Please try again and return ONLY valid JSON.";
  
  if (schema) {
    retry += `\n\nRequired schema:\n${schema}`;
  }
  
  retry += "\n\nDo not include any markdown code blocks, explanations, or extra text. Return only the JSON object or array.";
  
  return retry;
}

/**
 * Validate and parse with automatic retry capability
 */
export async function validateAndParse(
  responseText: string,
  requiredFields?: string[],
  retryFn?: (retryPrompt: string) => Promise<string>
): Promise<ValidationResult> {
  // First parse attempt
  let parseResult = parseJSON(responseText);
  
  if (!parseResult.valid && retryFn) {
    // Attempt retry
    const retryPrompt = generateRetryPrompt(responseText);
    try {
      const retryResponse = await retryFn(retryPrompt);
      parseResult = parseJSON(retryResponse);
    } catch (error) {
      // Retry failed, return original error
      return parseResult;
    }
  }
  
  if (!parseResult.valid) {
    return parseResult;
  }
  
  // Validate schema if required fields provided
  if (requiredFields && parseResult.data) {
    const schemaResult = validateSchema(parseResult.data, requiredFields);
    return schemaResult;
  }
  
  return parseResult;
}

