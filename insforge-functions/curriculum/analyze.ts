/**
 * InsForge Serverless Function for Comprehensive Curriculum Analysis
 * 
 * This function analyzes curriculum text and provides comprehensive analysis
 * including gaps, prerequisites, learning paths, and standards alignment.
 */

import { analyzeCurriculumComprehensive } from '../../services/analysis/curriculumAnalysisService';
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

  // Only allow POST requests
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
    const { rawText, gradeLevel, standardsFramework } = body;

    // Validate required fields
    if (!rawText || !gradeLevel || !standardsFramework) {
      return new Response(
        JSON.stringify({
          error: 'rawText, gradeLevel, and standardsFramework are required',
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

    // Validate gradeLevel
    if (!Object.values(GradeLevel).includes(gradeLevel as GradeLevel)) {
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

    // Validate standardsFramework
    if (!Object.values(StandardsFramework).includes(standardsFramework as StandardsFramework)) {
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

    // Perform comprehensive analysis
    const analysis = await analyzeCurriculumComprehensive(
      rawText,
      gradeLevel as GradeLevel,
      standardsFramework as StandardsFramework
    );

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis,
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
    console.error('Curriculum analysis error:', error);

    let errorMessage = 'Curriculum analysis failed';

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

