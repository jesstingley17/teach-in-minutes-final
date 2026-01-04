/**
 * InsForge Serverless Function for Streaming Curriculum Analysis
 * 
 * Provides Server-Sent Events (SSE) for real-time analysis updates
 */

import { streamCurriculumAnalysis } from '../../services/analysis/curriculumAnalysisStreamService';
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

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of streamCurriculumAnalysis(
            rawText,
            gradeLevel as GradeLevel,
            standardsFramework as StandardsFramework
          )) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // If complete or error, break
            if (chunk.type === 'complete' || chunk.type === 'error') {
              break;
            }
          }

          // Send final message
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamError: any) {
          // Send error as final chunk
          const errorChunk = {
            type: 'error',
            message: streamError.message || 'Streaming failed',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('Streaming analysis error:', error);

    return new Response(
      JSON.stringify({
        type: 'error',
        message: error.message || 'Analysis failed',
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

