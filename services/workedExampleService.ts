import OpenAI from 'openai';
import { GradeLevel } from '../types';
import { WORKED_EXAMPLE, buildPrompt } from './promptTemplates';

/**
 * Worked Example Service
 * Generates step-by-step worked examples with common mistake notes
 */

const getOpenAIClient = (): OpenAI => {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Worked example generation requires OpenAI.');
  }
  
  return new OpenAI({ apiKey });
};

export interface WorkedExample {
  problem: string;
  steps: string[];
  finalAnswer: string | number;
  commonMistake: string;
}

/**
 * Generate a worked example for a given problem
 */
export const generateWorkedExample = async (
  problem: string,
  grade: GradeLevel | string,
  topic?: string
): Promise<WorkedExample> => {
  const client = getOpenAIClient();
  
  const { system, user } = buildPrompt(
    WORKED_EXAMPLE.system,
    WORKED_EXAMPLE.user(problem, typeof grade === 'string' ? grade : grade),
    WORKED_EXAMPLE.fewShot
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
      temperature: WORKED_EXAMPLE.temperature,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    const example = JSON.parse(content) as WorkedExample;
    
    return example;
  } catch (error: any) {
    console.error('Worked example generation error:', error);
    throw new Error(`Worked example generation failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate multiple worked examples for a topic
 */
export const generateWorkedExamples = async (
  problems: string[],
  grade: GradeLevel | string,
  topic?: string
): Promise<WorkedExample[]> => {
  const examples = await Promise.all(
    problems.map(problem => 
      generateWorkedExample(problem, grade, topic).catch(() => ({
        problem,
        steps: ['Error generating example'],
        finalAnswer: 'N/A',
        commonMistake: 'Unable to generate'
      }))
    )
  );
  
  return examples;
};



