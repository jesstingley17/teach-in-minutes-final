import Anthropic from '@anthropic-ai/sdk';
import { CurriculumNode, InstructionalSuite, OutputType, BloomLevel, Differentiation, AestheticStyle, EducationalStandard, GradeLevel, StandardsFramework } from '../../src/types';

/**
 * Anthropic Claude Service - Provides AI capabilities using Claude models
 */

const getClaudeClient = (): Anthropic => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please check your environment variables.');
  }
  
  // Note: dangerouslyAllowBrowser is required for browser environments
  // This exposes the API key in the client bundle, which is a security risk
  // For production, consider using a serverless function proxy instead
  return new Anthropic({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });
};

export const analyzeCurriculumClaude = async (
  rawText: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework
): Promise<CurriculumNode[]> => {
  const client = getClaudeClient();
  
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : '';
  
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Analyze this curriculum/syllabus and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeContext}${standardsContext}
    
Text: ${rawText.substring(0, 15000)}

Return a JSON array of objects with: id, title, description, learningObjectives (array), suggestedDuration`
        }
      ],
      system: 'You are an expert instructional designer. Always respond with valid JSON arrays.'
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
    
    const text = content.text.trim();
    // Claude might return markdown code blocks, so strip them
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonText);
    
    return Array.isArray(parsed) ? parsed : (parsed.nodes || []);
  } catch (error: any) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

export const analyzeDocumentClaude = async (
  base64Data: string,
  mimeType: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework
): Promise<CurriculumNode[]> => {
  const client = getClaudeClient();
  
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : '';
  
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: `Analyze this document (syllabus, textbook, or curriculum) and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeContext}${standardsContext}

Return a JSON object with a "nodes" array containing objects with: id, title, description, learningObjectives (array), suggestedDuration`
            }
          ]
        }
      ],
      system: 'You are an expert instructional designer. Always respond with valid JSON.'
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
    
    const text = content.text.trim();
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonText);
    
    return parsed.nodes || [];
  } catch (error: any) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

export const generateSuiteClaude = async (
  node: CurriculumNode,
  outputType: OutputType,
  bloomLevel: BloomLevel,
  differentiation: Differentiation,
  aesthetic: AestheticStyle,
  branding: { institution: string, instructor: string },
  pageCount: number = 1,
  gradeLevel?: GradeLevel,
  standards?: EducationalStandard[]
): Promise<InstructionalSuite> => {
  const client = getClaudeClient();
  
  // Calculate sections
  const sectionsPerPage = pageCount === 1 ? 12 : pageCount <= 3 ? 10 : 8;
  const totalSections = pageCount * sectionsPerPage;
  
  let standardsText = '';
  if (standards && standards.length > 0) {
    standardsText = `\n  - Aligned Standards:\n${standards.map(s => `    * ${s.code}: ${s.description}`).join('\n')}\n  Ensure the content directly addresses and aligns with these standards.`;
  }

  const gradeText = gradeLevel ? `\n  - Grade Level: ${gradeLevel}` : '';
  
  const prompt = `Generate a professionally structured, classroom-ready ${outputType} for the topic: "${node.title}".

Details:
- Target Bloom's Taxonomy Level: ${bloomLevel}
- Differentiation Strategy: ${differentiation}${gradeText}
- Learning Objectives: ${node.learningObjectives.join(', ')}
- Topic Description: ${node.description}
- Target Pages: ${pageCount} pages (MUST generate at least ${totalSections} sections)${standardsText}

Generate comprehensive, substantial content. Return as JSON with: id, title, outputType, bloomLevel, differentiation, aesthetic, institutionName, instructorName, sections (array).

Each section should have: id, title, type (text|question|instruction|diagram_placeholder|matching), content, points (optional), options (optional array), correctAnswer (optional).

Return JSON object with all required fields.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      system: 'You are an expert instructional designer. Generate high-quality educational materials. Always respond with valid JSON matching the required schema.'
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
    
    const text = content.text.trim();
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suite = JSON.parse(jsonText);
    
    // Generate ID if not provided
    if (!suite.id) {
      suite.id = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set branding
    suite.institutionName = branding.institution || '';
    suite.instructorName = branding.instructor || '';
    
    return suite as InstructionalSuite;
  } catch (error: any) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};



