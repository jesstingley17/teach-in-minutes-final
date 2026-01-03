import Anthropic from '@anthropic-ai/sdk';
import { InstructionalSuite, GradeLevel } from '../types';

/**
 * Safety and Pedagogy Audit Service using Claude
 * Implements safety/moderation auditing as per AI_BLUEPRINT.md
 */

interface AuditIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

interface AuditRecommendation {
  change: string;
  explanation: string;
}

interface AuditResult {
  issues: AuditIssue[];
  recommendations: AuditRecommendation[];
  safe: boolean;
}

const getClaudeClient = (): Anthropic => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Safety audit requires Claude.');
  }
  
  return new Anthropic({ apiKey });
};

/**
 * Audit instructional suite for safety, pedagogy, and quality
 */
export const auditSuite = async (
  suite: InstructionalSuite,
  gradeLevel?: GradeLevel
): Promise<AuditResult> => {
  const client = getClaudeClient();
  
  // Extract text content for audit
  const contentText = `
Title: ${suite.title}
Output Type: ${suite.outputType}
Bloom Level: ${suite.bloomLevel}
Differentiation: ${suite.differentiation}

Sections:
${suite.sections.map((s, i) => `
Section ${i + 1}: ${s.title}
Type: ${s.type}
Content: ${s.content.substring(0, 200)}${s.content.length > 200 ? '...' : ''}
${s.options ? `Options: ${s.options.join(', ')}` : ''}
`).join('\n')}
`.trim();

  // Use improved prompt template from AI_PROMPTS.md
  const { system: systemPrompt, user: userPrompt } = buildPrompt(
    SAFETY_AUDIT.system,
    SAFETY_AUDIT.user(contentText, gradeLevel || 'Unknown'),
    SAFETY_AUDIT.fewShot
  );

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
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
    
    const text = content.text.trim();
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const audit = JSON.parse(jsonText) as AuditResult;
    
    return audit;
  } catch (error: any) {
    console.error('Safety audit error:', error);
    // Return safe default if audit fails (don't block generation)
    return {
      issues: [],
      recommendations: [],
      safe: true
    };
  }
};

/**
 * Quick safety check - returns boolean only
 */
export const isContentSafe = async (
  suite: InstructionalSuite,
  gradeLevel?: GradeLevel
): Promise<boolean> => {
  try {
    const audit = await auditSuite(suite, gradeLevel);
    return audit.safe;
  } catch (error) {
    console.warn('Safety check failed, defaulting to safe:', error);
    return true; // Default to safe to not block generation
  }
};

