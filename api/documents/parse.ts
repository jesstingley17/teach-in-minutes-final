/**
 * Vercel Serverless Function for Document Parsing
 * This API endpoint parses documents (PDFs, images) into curriculum nodes using Gemini AI
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeDocument } from '../../services/geminiService';
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
      base64Data,
      mimeType,
      gradeLevel,
      standardsFramework
    } = req.body;

    // Validate required fields
    if (!base64Data || !mimeType) {
      return res.status(400).json({ 
        error: 'base64Data and mimeType are required' 
      });
    }

    // Validate mimeType
    const validMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ];
    
    if (!validMimeTypes.includes(mimeType)) {
      return res.status(400).json({ 
        error: `Invalid mimeType. Supported types: ${validMimeTypes.join(', ')}` 
      });
    }

    // Validate gradeLevel if provided
    if (gradeLevel && !Object.values(GradeLevel).includes(gradeLevel as GradeLevel)) {
      return res.status(400).json({ 
        error: 'Invalid gradeLevel' 
      });
    }

    // Validate standardsFramework if provided
    if (standardsFramework && !Object.values(StandardsFramework).includes(standardsFramework as StandardsFramework)) {
      return res.status(400).json({ 
        error: 'Invalid standardsFramework' 
      });
    }

    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
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

    return res.status(200).json({
      success: true,
      nodes: nodes,
      count: nodes.length
    });

  } catch (error: any) {
    console.error('Document parsing error:', error);
    
    // Provide more specific error messages
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
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
