
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BloomLevel, Differentiation, OutputType, AestheticStyle, InstructionalSuite, CurriculumNode, GradeLevel, EducationalStandard } from "../types";

// Note: API_KEY is handled externally via import.meta.env
// We create the instance inside the functions to ensure it uses the latest key if refreshed

export const analyzeCurriculum = async (rawText: string): Promise<CurriculumNode[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
  }
  
  console.log('API Key configured:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this curriculum/syllabus and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.
    
    Text: ${rawText.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedDuration: { type: Type.STRING }
            },
            required: ["id", "title", "description", "learningObjectives"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

export const analyzeDocument = async (base64Data: string, mimeType: string): Promise<CurriculumNode[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze this document (syllabus, textbook, or curriculum) and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module. Provide the output in the requested JSON format."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedDuration: { type: Type.STRING }
            },
            required: ["id", "title", "description", "learningObjectives"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini API Error: ${error.message || 'Unknown error'}. Check console for details.`);
  }
};

export const generateSuite = async (
  node: CurriculumNode,
  outputType: OutputType,
  bloomLevel: BloomLevel,
  differentiation: Differentiation,
  aesthetic: AestheticStyle,
  branding: { institution: string, instructor: string },
  doodleBase64?: string,
  pageCount: number = 1,
  gradeLevel?: GradeLevel,
  standards?: EducationalStandard[]
): Promise<InstructionalSuite> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
  }
  
  console.log('Generating suite with API Key configured:', apiKey ? 'Yes' : 'No');
  
  const ai = new GoogleGenAI({ apiKey });

  const sectionsPerPage = pageCount === 1 ? 8 : pageCount <= 3 ? 6 : 5;
  const totalSections = pageCount * sectionsPerPage;
  
  let standardsText = '';
  if (standards && standards.length > 0) {
    standardsText = `\n  - Aligned Standards:\n${standards.map(s => `    * ${s.code}: ${s.description}`).join('\n')}\n  Ensure the content directly addresses and aligns with these standards.`;
  }

  const gradeText = gradeLevel ? `\n  - Grade Level: ${gradeLevel}` : '';

  const prompt = `Act as a world-class Instructional Designer. Generate a professionally structured ${outputType} for the topic: "${node.title}".
  
  Details:
  - Target Bloom's Taxonomy Level: ${bloomLevel}
  - Differentiation Strategy: ${differentiation}${gradeText}
  - Learning Objectives: ${node.learningObjectives.join(', ')}
  - Topic Description: ${node.description}
  - Target Pages: ${pageCount} pages (generate approximately ${totalSections} sections total, distributed across ${pageCount} pages)${standardsText}
  
  The output should be high-fidelity, pedagogically sound, and ready for classroom use. 
  Generate approximately ${totalSections} sections total to fill ${pageCount} pages with appropriate depth.
  Include clear instructions, a mix of question types (conceptual, calculation, critical thinking, matching, diagram prompts).
  Vary the section types throughout to create engaging, multi-page educational material.
  
  For ${differentiation}, ensure:
  - ADHD: Clear headers, chunked information, visual cues, extra white space.
  - ESL: Simplified phrasing, focus on vocabulary, visual scaffolding.
  - Gifted: Higher complexity, open-ended inquiries, synthesis tasks.
  
  Generate substantial content that justifies ${pageCount} page${pageCount > 1 ? 's' : ''} of material.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['text', 'question', 'instruction', 'diagram_placeholder', 'matching'] },
                  content: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "title", "type", "content"]
              }
            },
            doodlePrompt: { type: Type.STRING, description: "A simple prompt for a line-art doodle related to this topic." }
          },
          required: ["title", "sections", "doodlePrompt"]
        }
      }
    });

    const rawData = JSON.parse(response.text || '{}');
    
    // Ensure we have enough sections
    const sections = rawData.sections || [];
    
    return {
      ...rawData,
      id: Math.random().toString(36).substr(2, 9),
      nodeId: node.id,
      institutionName: branding.institution,
      instructorName: branding.instructor,
      outputType: outputType,
      bloomLevel: bloomLevel,
      differentiation: differentiation,
      aesthetic: aesthetic,
      doodleBase64: doodleBase64 || '',
      sections: sections,
      pageCount: pageCount,
      gradeLevel: gradeLevel,
      standards: standards,
      showStandards: true,
    };
  } catch (error: any) {
    console.error('Gemini API Error Details:', {
      message: error.message,
      status: error.status,
      details: error.details,
      fullError: error
    });
    
    let errorMessage = 'Generation failed. ';
    
    if (error.message?.includes('billing') || error.status === 403) {
      errorMessage += 'API key may not have billing enabled or may be invalid. Verify your Gemini API key has billing enabled for Gemini 3 Pro.';
    } else if (error.status === 401) {
      errorMessage += 'Invalid API key. Please check your GEMINI_API_KEY in Vercel environment variables.';
    } else if (error.status === 429) {
      errorMessage += 'Rate limit exceeded. Please try again in a moment.';
    } else if (error.message?.includes('not found')) {
      errorMessage += 'Model not found. The gemini-3-pro-preview model may not be available. Try using gemini-2.0-pro-exp instead.';
    } else {
      errorMessage += `${error.message || 'Unknown error'}. Check browser console for details.`;
    }
    
    throw new Error(errorMessage);
  }
};

export const generateDoodle = async (node: CurriculumNode, aesthetic: AestheticStyle): Promise<string> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, skipping doodle generation');
    return '';
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Create a single, clean, minimalistic black and white line-art doodle or icon representing: ${node.title}. The background must be pure white. No shading, just outlines. Suitable for a professional academic worksheet.` }
        ]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error: any) {
    console.error('Doodle generation failed:', error.message);
    // Non-critical, just return empty string
    return '';
  }
};
