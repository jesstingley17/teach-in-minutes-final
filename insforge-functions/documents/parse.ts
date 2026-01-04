/**
 * InsForge Serverless Function for Document Parsing
 * 
 * This function parses documents (PDFs, images) into curriculum nodes using Gemini AI
 */

import { analyzeDocument } from '../../services/ai/geminiService';
import { GradeLevel, StandardsFramework } from '../../src/types';

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

  try {
    const body = await request.json();
    const { base64Data, mimeType, gradeLevel, standardsFramework } = body;

    // Validate required fields
    if (!base64Data || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'base64Data and mimeType are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate mimeType
    const validMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ];

    if (!validMimeTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({
          error: `Invalid mimeType. Supported types: ${validMimeTypes.join(', ')}`,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate gradeLevel if provided
    if (gradeLevel && !Object.values(GradeLevel).includes(gradeLevel as GradeLevel)) {
      return new Response(
        JSON.stringify({ error: 'Invalid gradeLevel' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate standardsFramework if provided
    if (standardsFramework && !Object.values(StandardsFramework).includes(standardsFramework as StandardsFramework)) {
      return new Response(
        JSON.stringify({ error: 'Invalid standardsFramework' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Remove data URL prefix if present
    const cleanBase64 = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;

    // Call the analyzeDocument function
    const nodes = await analyzeDocument(
      cleanBase64,
      mimeType,
      gradeLevel as GradeLevel | undefined,
      standardsFramework as StandardsFramework | undefined
    );

    return new Response(
      JSON.stringify({
        success: true,
        nodes: nodes,
        count: nodes.length,
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
    console.error('Document parsing error:', error);

    let errorMessage = 'Document parsing failed';

    if (error.message?.includes('GEMINI_API_KEY')) {
      errorMessage = 'GEMINI_API_KEY is not configured on the server';
    } else if (error.message?.includes('billing') || error.message?.includes('403')) {
      errorMessage = 'API key may not have billing enabled or may be invalid';
    } else if (error.message?.includes('401')) {
      errorMessage = 'Invalid API key';
    } else if (error.message?.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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

