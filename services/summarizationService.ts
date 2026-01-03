import Anthropic from '@anthropic-ai/sdk';
import { CurriculumNode } from '../types';
import { DOCUMENT_SUMMARIZATION, buildPrompt } from './promptTemplates';

/**
 * Summarization Service using Claude
 * Handles long-document condensation as per AI_BLUEPRINT.md
 */

const getClaudeClient = (): Anthropic => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Summarization requires Claude.');
  }
  
  // Note: dangerouslyAllowBrowser is required for browser environments
  // This exposes the API key in the client bundle, which is a security risk
  // For production, consider using a serverless function proxy instead
  return new Anthropic({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });
};

export interface SummarizedSection {
  title: string;
  summary: string; // ≤60 words
  keyPoints: string[];
  activities?: string[];
}

export interface SummarizationResult {
  sections: SummarizedSection[];
  metadata: {
    originalLengthWords: number;
    condensedLengthWords: number;
  };
}

/**
 * Condense a long curriculum document into teaching-ready sections
 */
export const condenseCurriculum = async (
  text: string,
  numSections: number = 5
): Promise<SummarizationResult> => {
  const client = getClaudeClient();
  
  // Use improved prompt template
  const { system: systemPrompt, user: userPrompt } = buildPrompt(
    DOCUMENT_SUMMARIZATION.system,
    DOCUMENT_SUMMARIZATION.user(text, numSections)
  );

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }
    
    const text_content = content.text.trim();
    const jsonText = text_content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonText) as SummarizationResult;
    
    return result;
  } catch (error: any) {
    console.error('Summarization error:', error);
    throw new Error(`Summarization failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Quick summarization for curriculum nodes
 */
export const summarizeNode = async (
  node: CurriculumNode
): Promise<string> => {
  const client = getClaudeClient();
  
  const content = `
Title: ${node.title}
Description: ${node.description}
Learning Objectives: ${node.learningObjectives.join(', ')}
Suggested Duration: ${node.suggestedDuration}
`.trim();

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Provide a concise summary (≤100 words) of this curriculum node focusing on key learning points and activities:\n\n${content}`
        }
      ],
      system: 'You are a concise educational content summarizer. Be brief and focus on actionable teaching points.'
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      throw new Error('Unexpected response type');
    }
    
    return response.text.trim();
  } catch (error: any) {
    console.error('Quick summarization error:', error);
    return node.description; // Fallback to original description
  }
};

