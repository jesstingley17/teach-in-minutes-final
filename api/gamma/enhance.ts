/**
 * Vercel Serverless Function for Gamma API Enhancement
 * This proxies Gamma API calls to avoid CORS issues and keep API keys server-side
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GAMMA_API_KEY || process.env.VITE_GAMMA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GAMMA_API_KEY is not configured on the server' 
    });
  }

  try {
    const {
      content,
      title,
      format = 'presentation',
      options = {}
    } = req.body;

    if (!content || !title) {
      return res.status(400).json({ 
        error: 'Content and title are required' 
      });
    }

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

    const apiUrl = 'https://public-api.gamma.app/v1.0/generations';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputText: content,
        textMode: 'useExisting',
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
      const errorData = await response.json().catch(() => ({ 
        message: response.statusText 
      }));
      
      return res.status(response.status).json({ 
        error: `Gamma API error: ${errorData.message || response.statusText}`,
        status: response.status
      });
    }

    const result = await response.json();

    return res.status(200).json({
      documentId: result.id || result.documentId || result.generationId,
      url: result.url || result.previewUrl || result.link,
      status: result.status || 'success',
      message: result.message,
      generationId: result.generationId || result.id
    });

  } catch (error: any) {
    console.error('Gamma API proxy error:', error);
    return res.status(500).json({ 
      error: `Gamma design enhancement failed: ${error.message || 'Unknown error'}` 
    });
  }
}

