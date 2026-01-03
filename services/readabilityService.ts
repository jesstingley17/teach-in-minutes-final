import OpenAI from 'openai';
import { GradeLevel } from '../types';
import { READABILITY_ADJUSTER, buildPrompt } from './promptTemplates';

/**
 * Readability Service
 * Adjusts text to specific grade reading levels
 */

const getOpenAIClient = (): OpenAI => {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Readability adjustment requires OpenAI.');
  }
  
  return new OpenAI({ apiKey });
};

export interface ReadabilityResult {
  original: string;
  rewritten: string;
  readingLevelEstimate: string;
}

/**
 * Adjust text to a target grade reading level
 */
export const adjustReadability = async (
  text: string,
  targetGrade: GradeLevel | string
): Promise<ReadabilityResult> => {
  const client = getOpenAIClient();
  
  const { system, user } = buildPrompt(
    READABILITY_ADJUSTER.system,
    READABILITY_ADJUSTER.user(text, typeof targetGrade === 'string' ? targetGrade : targetGrade)
  );
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: system
        },
        {
          role: 'user',
          content: user
        }
      ],
      response_format: { type: 'json_object' },
      temperature: READABILITY_ADJUSTER.temperature,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    const result = JSON.parse(content) as ReadabilityResult;
    
    return result;
  } catch (error: any) {
    console.error('Readability adjustment error:', error);
    // Return original text on error
    return {
      original: text,
      rewritten: text,
      readingLevelEstimate: 'Unknown'
    };
  }
};

/**
 * Adjust multiple text passages
 */
export const adjustReadabilityBatch = async (
  texts: string[],
  targetGrade: GradeLevel | string
): Promise<ReadabilityResult[]> => {
  const results = await Promise.all(
    texts.map(text => adjustReadability(text, targetGrade))
  );
  
  return results;
};

