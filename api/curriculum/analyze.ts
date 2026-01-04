/**
 * Vercel Serverless Function for Comprehensive Curriculum Analysis
 * This API endpoint provides deep curriculum analysis including gaps, prerequisites, learning paths, etc.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeCurriculumComprehensive } from '../../services/curriculumAnalysisService';
import { GradeLevel, StandardsFramework } from '../../src/types';

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

  try {
    const {
      rawText,
      gradeLevel,
      standardsFramework
    } = req.body;

    // Validate required fields
    if (!rawText || !gradeLevel || !standardsFramework) {
      return res.status(400).json({ 
        error: 'rawText, gradeLevel, and standardsFramework are required' 
      });
    }

    // Validate gradeLevel
    if (!Object.values(GradeLevel).includes(gradeLevel as GradeLevel)) {
      return res.status(400).json({ 
        error: 'Invalid gradeLevel' 
      });
    }

    // Validate standardsFramework
    if (!Object.values(StandardsFramework).includes(standardsFramework as StandardsFramework)) {
      return res.status(400).json({ 
        error: 'Invalid standardsFramework' 
      });
    }

    // Perform comprehensive analysis
    const analysis = await analyzeCurriculumComprehensive(
      rawText,
      gradeLevel as GradeLevel,
      standardsFramework as StandardsFramework
    );

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error: any) {
    console.error('Curriculum analysis error:', error);
    
    // Provide more specific error messages
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
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

