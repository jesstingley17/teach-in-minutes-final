import Anthropic from '@anthropic-ai/sdk';
import { CurriculumNode } from '../types';

/**
 * Summarization Service using Claude
 * Handles long-document condensation as per AI_BLUEPRINT.md
 */

const getClaudeClient = (): Anthropic => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Summarization requires Claude.');
  }
  
  return new Anthropic({ apiKey });
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
  
  const systemPrompt = `You are a precise summarizer. Condense the input document into N teaching-ready sections. Output JSON using schema: {sections:[{title,summary(<=60 words),keyPoints:[],activities:[]}],metadata:{originalLengthWords,condensedLengthWords}}. Return only valid JSON. Be conservative: do not invent facts; if something isn't present, say it is 'not stated' in the summary fields.`;

  const userPrompt = `Summarize this curriculum into ${numSections} sections: Learning Goal, Key Concepts, Activities (3), Assessment Ideas (2), Differentiation (2). Ensure each summary is ≤60 words.

Text: ${text.substring(0, 100000)}`; // Claude can handle long context

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
      model: 'claude-3-5-sonnet-20241022',
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

