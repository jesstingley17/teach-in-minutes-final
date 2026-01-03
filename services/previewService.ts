import OpenAI from 'openai';
import { CurriculumNode, OutputType, BloomLevel, Differentiation, AestheticStyle } from '../types';

/**
 * Preview Service - Fast preview generation using cheaper OpenAI models
 * Implements quick preview pipeline as per AI_BLUEPRINT.md
 */

const getOpenAIClient = (): OpenAI => {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Preview generation requires OpenAI.');
  }
  
  return new OpenAI({ apiKey });
};

/**
 * Generate a quick preview of a worksheet (faster, cheaper model)
 * Returns a simplified version for immediate user feedback
 */
export const generateQuickPreview = async (
  node: CurriculumNode,
  outputType: OutputType,
  bloomLevel: BloomLevel,
  differentiation: Differentiation
): Promise<{
  title: string;
  overview: string;
  estimatedSections: number;
  sampleSections: Array<{ type: string; title: string; preview: string }>;
}> => {
  const client = getOpenAIClient();
  
  const prompt = `Generate a quick preview for a ${outputType} on: "${node.title}"

Context:
- Learning Objectives: ${node.learningObjectives.join(', ')}
- Bloom Level: ${bloomLevel}
- Differentiation: ${differentiation}

Provide a JSON object with:
{
  "title": "Worksheet title",
  "overview": "Brief overview (2-3 sentences)",
  "estimatedSections": number,
  "sampleSections": [
    {"type": "warmup|practice|assessment", "title": "Section title", "preview": "Brief preview of content"}
  ]
}

Return ONLY valid JSON.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Cheaper, faster model for previews
      messages: [
        {
          role: 'system',
          content: 'You are an educational content preview generator. Return ONLY valid JSON, no commentary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    const preview = JSON.parse(content);
    
    return {
      title: preview.title || node.title,
      overview: preview.overview || '',
      estimatedSections: preview.estimatedSections || 8,
      sampleSections: preview.sampleSections || []
    };
  } catch (error: any) {
    console.error('Preview generation error:', error);
    // Return a basic preview on error
    return {
      title: node.title,
      overview: `A ${outputType} covering ${node.description}`,
      estimatedSections: 8,
      sampleSections: []
    };
  }
};

