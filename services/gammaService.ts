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
  amount?: 'brief' | 'standard' | 'detailed';
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
 */
const getGammaApiKey = (): string => {
  const apiKey = import.meta.env.GAMMA_API_KEY;
  
  if (!apiKey) {
    throw new Error('GAMMA_API_KEY is not configured. Gamma design enhancement requires an API key.');
  }
  
  return apiKey;
};

/**
 * Enhance educational material design using Gamma API
 * This generates a presentation or document with enhanced visual design
 */
export const enhanceDesignWithGamma = async (
  content: string,
  title: string,
  format: 'presentation' | 'document' = 'presentation',
  options: GammaDesignOptions = {}
): Promise<GammaGenerationResult> => {
  const apiKey = getGammaApiKey();
  const apiUrl = 'https://public-api.gamma.app/v1.0/generations';
  
  const {
    tone = 'educational',
    audience = 'students',
    amount = 'standard',
    language = 'en',
    themeId,
    numCards = 10,
    cardSplit = 'auto',
    additionalInstructions,
    imageSource = 'aiGenerated'
  } = options;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputText: content,
        textMode: 'useExisting', // Use the provided content
        format: format,
        title: title,
        themeId: themeId,
        numCards: numCards,
        cardSplit: cardSplit,
        additionalInstructions: additionalInstructions || `Create an engaging ${format} for educational use. Make it visually appealing and student-friendly.`,
        textOptions: {
          amount: amount,
          tone: tone,
          audience: audience,
          language: language
        },
        imageOptions: {
          source: imageSource
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Gamma API error: ${errorData.message || response.statusText} (${response.status})`);
    }
    
    const result = await response.json();
    
    return {
      documentId: result.id || result.documentId || result.generationId,
      url: result.url || result.previewUrl || result.link,
      status: result.status || 'success',
      message: result.message,
      generationId: result.generationId || result.id
    };
  } catch (error: any) {
    console.error('Gamma API error:', error);
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

