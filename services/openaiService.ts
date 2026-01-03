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

  // Enhanced system prompt following AI_BLUEPRINT.md
  const systemPrompt = `You are an expert K-5 teacher and strict JSON generator. Return ONLY valid JSON in the schema below. Do not return any other text, markdown, or commentary. If you cannot answer or need clarification, return a JSON object {error: 'clarify', message: '...'} rather than free text.

REQUIREMENTS:
- Return ONLY valid JSON - no markdown code blocks, no explanations
- Keep explanations concise (<40 words each)
- Use US grade labels (K, 1, 2, 3...)
- All text must be complete - NO truncated sentences
- NO HTML entities (use proper characters: & not &amp;, > not &gt;)
- Every question MUST include correctAnswer field
- Matching exercises MUST include both content (items) and options array`;

  // Enhanced user prompt with strict JSON requirement
  const enhancedPrompt = `${prompt}

CRITICAL: Return ONLY valid JSON. Do NOT include markdown code blocks, explanations, or any text outside the JSON object. The JSON must exactly match the required schema with all fields.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more structured output (per blueprint)
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    // Parse with validation
    let suite: any;
    try {
      suite = JSON.parse(content);
    } catch (parseError) {
      // Retry once with strict instruction
      console.warn('JSON parse failed, attempting retry...');
      const retryResponse = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `The previous response was invalid JSON. Please try again and return ONLY valid JSON.\n\n${enhancedPrompt}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 4000
      });
      
      const retryContent = retryResponse.choices[0]?.message?.content;
      if (!retryContent) throw new Error('No response from OpenAI retry');
      suite = JSON.parse(retryContent);
    }
    
    // Generate ID if not provided
    if (!suite.id) {
      suite.id = `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set branding
    suite.institutionName = branding.institution || '';
    suite.instructorName = branding.instructor || '';
    
    // Add metadata (per blueprint)
    suite.metadata = {
      modelUsed: 'gpt-4o',
      generationTimeSec: Date.now() / 1000,
      provider: 'OpenAI'
    };
    
    return suite as InstructionalSuite;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

