/**
 * Gamma API Service
 * Integrates Gamma API for design enhancement of educational materials
 * 
 * Gamma API allows generating presentations, documents, and websites with AI-powered design
 * Documentation: https://developers.gamma.app
 * API Endpoint: https://public-api.gamma.app/v1.0/generations
 */

export interface GammaDesignOptions {
  tone?: 'professional' | 'playful' | 'educational' | 'engaging';
  audience?: 'general' | 'students' | 'teachers' | 'parents';
  amount?: 'brief' | 'medium' | 'detailed' | 'extensive'; // Updated to match Gamma API valid values
  language?: string;
  themeId?: string;
  numCards?: number;
  cardSplit?: 'auto' | 'manual';
  additionalInstructions?: string;
  imageSource?: 'aiGenerated' | 'unsplash' | 'none';
}

export interface GammaGenerationResult {
  documentId?: string;
  url?: string;
  status: string;
  message?: string;
  generationId?: string;
}

/**
 * Get Gamma API client configuration
 * Note: API key is now handled server-side via Vercel API route
 * This function is kept for backward compatibility but not used in the new implementation
 */
const getGammaApiKey = (): string => {
  const apiKey = import.meta.env.GAMMA_API_KEY;
  
  if (!apiKey) {
    // Don't throw error here - the API route will handle it
    // This allows the UI to show the button even if key isn't in client env
    return '';
  }
  
  return apiKey;
};

/**
 * Enhance educational material design using Gamma API
 * This generates a presentation or document with enhanced visual design
 * Uses Vercel serverless function to proxy requests and avoid CORS issues
 */
export const enhanceDesignWithGamma = async (
  content: string,
  title: string,
  format: 'presentation' | 'document' = 'presentation',
  options: GammaDesignOptions = {}
): Promise<GammaGenerationResult> => {
  // Use Vercel API route to proxy the request (avoids CORS and keeps API key server-side)
  const apiUrl = '/api/gamma/enhance';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        title,
        format,
        options
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: response.statusText 
      }));
      throw new Error(errorData.error || `Gamma API error: ${response.statusText} (${response.status})`);
    }
    
    const result = await response.json();
    
    return {
      documentId: result.documentId,
      url: result.url,
      status: result.status || 'success',
      message: result.message,
      generationId: result.generationId
    };
  } catch (error: any) {
    console.error('Gamma API error:', error);
    // Check if it's a network/CORS error
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Gamma design enhancement failed: Network error. Please check your connection and ensure the API route is deployed.');
    }
    throw new Error(`Gamma design enhancement failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate a presentation from educational content
 */
export const generatePresentation = async (
  content: string,
  title: string,
  options: GammaDesignOptions = {}
): Promise<GammaGenerationResult> => {
  return enhanceDesignWithGamma(content, title, 'presentation', {
    ...options,
    tone: options.tone || 'educational',
    audience: options.audience || 'students'
  });
};

/**
 * Generate a document with enhanced design
 */
export const generateEnhancedDocument = async (
  content: string,
  title: string,
  options: GammaDesignOptions = {}
): Promise<GammaGenerationResult> => {
  return enhanceDesignWithGamma(content, title, 'document', {
    ...options,
    tone: options.tone || 'professional',
    audience: options.audience || 'teachers'
  });
};

/**
 * Export Gamma-generated content as PDF or PPTX
 */
export const exportGammaContent = async (
  generationId: string,
  exportAs: 'pdf' | 'pptx' = 'pdf'
): Promise<{ downloadUrl?: string; status: string }> => {
  const apiKey = getGammaApiKey();
  const apiUrl = `https://public-api.gamma.app/v1.0/generations/${generationId}/export`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exportAs: exportAs
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Gamma export error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      downloadUrl: result.downloadUrl || result.url,
      status: result.status || 'success'
    };
  } catch (error: any) {
    console.error('Gamma export error:', error);
    throw new Error(`Gamma export failed: ${error.message || 'Unknown error'}`);
  }
};

