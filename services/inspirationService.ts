import { GoogleGenAI } from '@google/genai';

export interface InspirationAnalysis {
  layout: {
    structure: string;
    sections: string[];
    spacing: string;
    orientation: string;
  };
  design: {
    colors: string[];
    fonts: string;
    styling: string;
    visualElements: string[];
  };
  recommendations: string;
}

export const analyzeInspiration = async (
  base64Data: string,
  mimeType: string,
  copyLayout: boolean,
  copyDesign: boolean
): Promise<InspirationAnalysis> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this educational material (PDF/photo) and extract:
${copyLayout ? '- Layout structure: page layout, sections organization, spacing, margins, text flow, orientation\n- Section breakdown: identify all sections and their arrangement\n' : ''}
${copyDesign ? '- Design elements: color palette, font styles, visual styling, borders, backgrounds\n- Visual elements: icons, images, diagrams, decorative elements\n' : ''}

${copyLayout && copyDesign ? 'Extract both layout AND design information.' : copyLayout ? 'Focus ONLY on layout structure and organization.' : 'Focus ONLY on design elements and styling.'}

Provide detailed, actionable information that can be used to replicate the ${copyLayout && copyDesign ? 'layout and design' : copyLayout ? 'layout' : 'design'} of this document.`;

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
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            layout: {
              type: "object",
              properties: {
                structure: { type: "string" },
                sections: { type: "array", items: { type: "string" } },
                spacing: { type: "string" },
                orientation: { type: "string" }
              }
            },
            design: {
              type: "object",
              properties: {
                colors: { type: "array", items: { type: "string" } },
                fonts: { type: "string" },
                styling: { type: "string" },
                visualElements: { type: "array", items: { type: "string" } }
              }
            },
            recommendations: { type: "string" }
          },
          required: ["layout", "design", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.error('Inspiration analysis failed:', error);
    throw new Error(`Failed to analyze inspiration: ${error.message}`);
  }
};


