/**
 * InsForge Serverless Function for Gamma API Enhancement
 * 
 * This proxies Gamma API calls to avoid CORS issues and keep API keys server-side
 */

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Get API key from InsForge environment variables
  const apiKey = process.env.GAMMA_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GAMMA_API_KEY is not configured on the server' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    const body = await request.json();
    const {
      content,
      title,
      format = 'presentation',
      options = {},
    } = body;

    if (!content || !title) {
      return new Response(
        JSON.stringify({ error: 'Content and title are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const {
      tone = 'educational',
      audience = 'students',
      amount = 'medium',
      language = 'en',
      themeId,
      numCards = 10,
      cardSplit = 'auto',
      additionalInstructions,
      imageSource = 'aiGenerated',
    } = options;

    // Map amount to valid Gamma API values
    const validAmount = ['brief', 'medium', 'detailed', 'extensive'].includes(amount)
      ? amount
      : 'medium';

    const apiUrl = 'https://public-api.gamma.app/v1.0/generations';
    const fullContent = `# ${title}\n\n${content}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText: fullContent,
        textMode: 'preserve',
        format: format,
        themeId: themeId,
        numCards: numCards,
        cardSplit: cardSplit,
        additionalInstructions:
          additionalInstructions ||
          `Create an engaging ${format} for educational use. Make it visually appealing and student-friendly.`,
        textOptions: {
          amount: validAmount,
          tone: tone,
          audience: audience,
          language: language,
        },
        imageOptions: {
          source: imageSource,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));

      return new Response(
        JSON.stringify({
          error: `Gamma API error: ${errorData.message || response.statusText}`,
          status: response.status,
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        documentId: result.id || result.documentId || result.generationId,
        url: result.url || result.previewUrl || result.link,
        status: result.status || 'success',
        message: result.message,
        generationId: result.generationId || result.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: any) {
    console.error('Gamma API proxy error:', error);
    return new Response(
      JSON.stringify({
        error: `Gamma design enhancement failed: ${error.message || 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

