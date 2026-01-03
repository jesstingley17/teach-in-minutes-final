/**
 * Adobe Creative SDK Integration
 * Provides access to Adobe design tools, assets, and creative services
 * 
 * Documentation: https://developer.adobe.com/creative-cloud/
 */

export interface AdobeAsset {
  id: string;
  name: string;
  type: 'image' | 'template' | 'font' | 'color';
  url?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface AdobeSearchOptions {
  query: string;
  type?: 'image' | 'template' | 'font' | 'color' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * Get Adobe Creative SDK access token
 */
async function getCreativeAccessToken(): Promise<string> {
  const clientId = import.meta.env.ADOBE_CLIENT_ID;
  const clientSecret = import.meta.env.ADOBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Adobe Creative SDK credentials not configured. Please set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET in environment variables.');
  }

  const tokenUrl = 'https://ims-na1.adobelogin.com/ims/token/v3';
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid,AdobeID,creative_sdk'
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe Creative SDK authentication failed: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error('Adobe Creative SDK token error:', error);
    throw new Error(`Failed to get Adobe Creative SDK access token: ${error.message}`);
  }
}

/**
 * Search Adobe Stock for images, templates, and assets
 */
export async function searchAdobeStock(
  options: AdobeSearchOptions
): Promise<{ success: boolean; assets?: AdobeAsset[]; error?: string }> {
  try {
    const accessToken = await getCreativeAccessToken();
    
    const apiUrl = 'https://stock.adobe.io/Rest/Media/1/Search/Files';
    
    const params = new URLSearchParams({
      'search_parameters[words]': options.query,
      'search_parameters[limit]': String(options.limit || 20),
      'search_parameters[offset]': String(options.offset || 0),
      ...(options.type && options.type !== 'all' && {
        'search_parameters[filters][content_type:photo]': options.type === 'image' ? '1' : '0'
      })
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': import.meta.env.ADOBE_CLIENT_ID
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Adobe Stock search failed: ${error}`);
    }

    const data = await response.json();
    
    const assets: AdobeAsset[] = (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.title,
      type: 'image' as const,
      url: file.download_url,
      thumbnailUrl: file.thumbnail_url,
      metadata: {
        width: file.width,
        height: file.height,
        category: file.category
      }
    }));

    return {
      success: true,
      assets
    };
  } catch (error: any) {
    console.error('Adobe Stock search error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get educational design templates from Adobe
 */
export async function getEducationalTemplates(
  category: 'worksheet' | 'presentation' | 'handout' | 'all' = 'all'
): Promise<{ success: boolean; templates?: AdobeAsset[]; error?: string }> {
  try {
    const accessToken = await getCreativeAccessToken();
    
    // Search for educational templates
    const query = category === 'all' 
      ? 'educational template worksheet'
      : `educational ${category} template`;
    
    return await searchAdobeStock({
      query,
      type: 'template',
      limit: 50
    });
  } catch (error: any) {
    console.error('Adobe template search error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get color palettes suitable for educational materials
 */
export async function getEducationalColorPalettes(): Promise<{
  success: boolean;
  palettes?: Array<{
    name: string;
    colors: string[];
    description?: string;
  }>;
  error?: string;
}> {
  // Predefined educational color palettes
  const palettes = [
    {
      name: 'Primary Classroom',
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      description: 'Vibrant and engaging colors for elementary materials'
    },
    {
      name: 'Academic Professional',
      colors: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED'],
      description: 'Professional colors for academic materials'
    },
    {
      name: 'Soft Pastels',
      colors: ['#93C5FD', '#6EE7B7', '#FCD34D', '#FCA5A5', '#C4B5FD'],
      description: 'Gentle pastels for younger students'
    },
    {
      name: 'High Contrast',
      colors: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#00FF00'],
      description: 'High contrast for accessibility'
    }
  ];

  return {
    success: true,
    palettes
  };
}

/**
 * Generate design suggestions based on content type
 */
export async function getDesignSuggestions(
  contentType: 'worksheet' | 'guided-notes' | 'presentation',
  gradeLevel?: string
): Promise<{
  success: boolean;
  suggestions?: {
    colorPalette: string[];
    fontRecommendations: string[];
    layoutTips: string[];
  };
  error?: string;
}> {
  try {
    // Get appropriate color palette
    const paletteResult = await getEducationalColorPalettes();
    const palette = paletteResult.palettes?.[0]?.colors || ['#3B82F6', '#10B981', '#F59E0B'];

    const fontRecommendations = 
      gradeLevel && parseInt(gradeLevel) <= 3
        ? ['Comic Sans MS', 'OpenDyslexic', 'Nunito']
        : ['Inter', 'Roboto', 'Open Sans'];

    const layoutTips = {
      'worksheet': [
        'Use clear section headers',
        'Include ample white space',
        'Add visual breaks between exercises',
        'Use consistent spacing'
      ],
      'guided-notes': [
        'Use fill-in-the-blank format',
        'Include visual cues for key concepts',
        'Add diagram placeholders',
        'Use consistent formatting'
      ],
      'presentation': [
        'Keep slides simple and focused',
        'Use large, readable fonts',
        'Include visual elements',
        'Maintain consistent design'
      ]
    };

    return {
      success: true,
      suggestions: {
        colorPalette: palette,
        fontRecommendations,
        layoutTips: layoutTips[contentType] || []
      }
    };
  } catch (error: any) {
    console.error('Design suggestions error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

