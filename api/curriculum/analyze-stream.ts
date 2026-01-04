/**
 * Vercel Serverless Function for Streaming Curriculum Analysis
 * Provides Server-Sent Events (SSE) for real-time analysis updates
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamCurriculumAnalysis } from '../../services/curriculumAnalysisStreamService';
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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream analysis chunks
    try {
      for await (const chunk of streamCurriculumAnalysis(
        rawText,
        gradeLevel as GradeLevel,
        standardsFramework as StandardsFramework
      )) {
        // Send chunk as SSE
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        
        // Flush to ensure data is sent immediately
        if (typeof res.flush === 'function') {
          res.flush();
        }

        // If complete or error, break
        if (chunk.type === 'complete' || chunk.type === 'error') {
          break;
        }
      }

      // Send final message
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamError: any) {
      // Send error as final chunk
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: streamError.message || 'Streaming failed'
      })}\n\n`);
      res.end();
    }

  } catch (error: any) {
    console.error('Streaming analysis error:', error);
    
    // If headers not sent yet, send error as JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: error.message || 'Analysis failed'
      });
    }
    
    // Otherwise send as SSE
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message || 'Analysis failed'
    })}\n\n`);
    res.end();
  }
}

