
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BloomLevel, Differentiation, OutputType, AestheticStyle, InstructionalSuite, CurriculumNode } from "../types";

// Note: API_KEY is handled externally via process.env.API_KEY
// We create the instance inside the functions to ensure it uses the latest key if refreshed

export const analyzeCurriculum = async (rawText: string): Promise<CurriculumNode[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY || '' });
  
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
};

export const analyzeDocument = async (base64Data: string, mimeType: string): Promise<CurriculumNode[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY || '' });
  
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
};

export const generateSuite = async (
  node: CurriculumNode,
  config: {
    outputType: OutputType,
    bloomLevel: BloomLevel,
    differentiation: Differentiation,
    branding: { institution: string, instructor: string }
  }
): Promise<InstructionalSuite> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY || '' });

  const prompt = `Act as a world-class Instructional Designer. Generate a professionally structured ${config.outputType} for the topic: "${node.title}".
  
  Details:
  - Target Bloom's Taxonomy Level: ${config.bloomLevel}
  - Differentiation Strategy: ${config.differentiation}
  - Learning Objectives: ${node.learningObjectives.join(', ')}
  - Topic Description: ${node.description}
  
  The output should be high-fidelity, pedagogically sound, and ready for classroom use. 
  Include clear instructions, a mix of question types (conceptual, calculation, critical thinking), and enough content for a multi-page document.
  
  For ${config.differentiation}, ensure:
  - ADHD: Clear headers, chunked information, visual cues, extra white space.
  - ESL: Simplified phrasing, focus on vocabulary, visual scaffolding.
  - Gifted: Higher complexity, open-ended inquiries, synthesis tasks.
  `;

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
  
  return {
    ...rawData,
    id: Math.random().toString(36).substr(2, 9),
    nodeId: node.id,
    institutionName: config.branding.institution,
    instructorName: config.branding.instructor,
    outputType: config.outputType,
    bloomLevel: config.bloomLevel,
    differentiation: config.differentiation,
    aesthetic: AestheticStyle.MODERN,
  };
};

export const generateDoodle = async (topicPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `Create a single, clean, minimalistic black and white line-art doodle or icon representing: ${topicPrompt}. The background must be pure white. No shading, just outlines. Suitable for a professional academic worksheet.` }
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
};
