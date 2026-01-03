import OpenAI from 'openai';
import { CurriculumNode, InstructionalSuite, OutputType, BloomLevel, Differentiation, AestheticStyle, EducationalStandard, GradeLevel, StandardsFramework, Rubric } from '../types';

/**
 * OpenAI Service - Provides AI capabilities using OpenAI models
 */

const getOpenAIClient = (): OpenAI => {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Please check your environment variables.');
  }
  
  return new OpenAI({ apiKey });
};

export const analyzeCurriculumOpenAI = async (
  rawText: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework
): Promise<CurriculumNode[]> => {
  const client = getOpenAIClient();
  
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : '';
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Analyze curriculum and decompose it into logical instructional nodes. Always respond with valid JSON arrays.'
        },
        {
          role: 'user',
          content: `Analyze this curriculum/syllabus and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeContext}${standardsContext}
    
Text: ${rawText.substring(0, 15000)}

Return a JSON array of objects with: id, title, description, learningObjectives (array), suggestedDuration`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    const parsed = JSON.parse(content);
    // Handle both { nodes: [...] } and [...] formats
    return Array.isArray(parsed) ? parsed : (parsed.nodes || []);
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

export const analyzeDocumentOpenAI = async (
  base64Data: string,
  mimeType: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework
): Promise<CurriculumNode[]> => {
  const client = getOpenAIClient();
  
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : '';
  
  try {
    // Convert base64 to data URL
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Analyze documents and decompose them into logical instructional nodes. Always respond with valid JSON arrays.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl }
            },
            {
              type: 'text',
              text: `Analyze this document (syllabus, textbook, or curriculum) and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeContext}${standardsContext}

Return a JSON object with a "nodes" array containing objects with: id, title, description, learningObjectives (array), suggestedDuration`
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    const parsed = JSON.parse(content);
    return parsed.nodes || [];
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

export const generateSuiteOpenAI = async (
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
  const client = getOpenAIClient();
  
  // Calculate sections
  const sectionsPerPage = pageCount === 1 ? 12 : pageCount <= 3 ? 10 : 8;
  const totalSections = pageCount * sectionsPerPage;
  
  let standardsText = '';
  if (standards && standards.length > 0) {
    standardsText = `\n  - Aligned Standards:\n${standards.map(s => `    * ${s.code}: ${s.description}`).join('\n')}\n  Ensure the content directly addresses and aligns with these standards.`;
  }

  const gradeText = gradeLevel ? `\n  - Grade Level: ${gradeLevel}` : '';
  
  // Build prompt (simplified version - you'd want to include all the detailed instructions)
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
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Generate high-quality educational materials. Always respond with valid JSON matching the required schema.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    const suite = JSON.parse(content);
    
    // Generate ID if not provided
    if (!suite.id) {
      suite.id = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set branding
    suite.institutionName = branding.institution || '';
    suite.instructorName = branding.instructor || '';
    
    return suite as InstructionalSuite;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

