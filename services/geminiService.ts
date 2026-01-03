
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BloomLevel, Differentiation, OutputType, AestheticStyle, InstructionalSuite, CurriculumNode, GradeLevel, EducationalStandard, Rubric, StandardsFramework } from "../types";

// Note: API_KEY is handled externally via import.meta.env
// We create the instance inside the functions to ensure it uses the latest key if refreshed

export const analyzeCurriculum = async (
  rawText: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework
): Promise<CurriculumNode[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
  }
  
  console.log('API Key configured:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
  
  const ai = new GoogleGenAI({ apiKey });
  
  const gradeContext = gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : '';
  const standardsContext = standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this curriculum/syllabus and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeContext}${standardsContext}
    
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

export const analyzeDocument = async (
  base64Data: string, 
  mimeType: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework
): Promise<CurriculumNode[]> => {
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
          text: `Analyze this document (syllabus, textbook, or curriculum) and decompose it into a logical sequence of instructional nodes. Each node should represent a discrete lesson or module.${gradeLevel ? `\n\nGrade Level Context: ${gradeLevel}` : ''}${standardsFramework ? `\n\nEducational Standards Framework: ${standardsFramework}. Consider relevant standards when decomposing the curriculum.` : ''}\n\nProvide the output in the requested JSON format.`
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

  const outputTypeInstructions = outputType === OutputType.GUIDED_NOTES 
    ? `IMPORTANT: For GUIDED NOTES, you must create content that VERBATIM follows the structure and content of the original curriculum/document. Use fill-in-the-blank format, key terms with spaces, and structured outlines that match the source material exactly. This should help students take notes alongside the content, not create new questions.`
    : `For WORKSHEET, create questions, exercises, and activities for students to complete.`;

  const prompt = `Act as a world-class Instructional Designer. Generate a professionally structured ${outputType} for the topic: "${node.title}".
  
  Details:
  - Target Bloom's Taxonomy Level: ${bloomLevel}
  - Differentiation Strategy: ${differentiation}${gradeText}
  - Learning Objectives: ${node.learningObjectives.join(', ')}
  - Topic Description: ${node.description}
  - Target Pages: ${pageCount} pages (generate approximately ${totalSections} sections total, distributed across ${pageCount} pages)${standardsText}
  
  ${outputTypeInstructions}
  
  The output should be high-fidelity, pedagogically sound, and ready for classroom use. 
  Generate approximately ${totalSections} sections total to fill ${pageCount} pages with appropriate depth.
  Include clear instructions, a mix of question types (conceptual, calculation, critical thinking, matching, diagram prompts).
  Vary the section types throughout to create engaging, multi-page educational material.
  
  For ${differentiation}, ensure:
  - ADHD: Clear headers, chunked information, visual cues, extra white space.
  - ESL: Simplified phrasing, focus on vocabulary, visual scaffolding.
  - Gifted: Higher complexity, open-ended inquiries, synthesis tasks.
  
  Generate substantial content that justifies ${pageCount} page${pageCount > 1 ? 's' : ''} of material.
  
  CRITICAL REQUIREMENTS - READ CAREFULLY:
  
  1. COMPLETE CONTENT: ALL text must be complete. NO truncated sentences, NO incomplete thoughts, NO cut-off words. Every sentence must have a proper ending. Every section must have complete, usable content.
  
  2. MATCHING EXERCISES: For matching type sections, you MUST provide:
     - 'content': One item per line (e.g., "4/8\n6/12\n8/16") - these are the items students will match
     - 'options': An array of strings (e.g., ["1/2", "1/3", "1/4"]) - these are the answer choices in the word bank
     - 'correctAnswer': An array of indices mapping each content item to its matching option (e.g., [0, 0, 0] means all three items match option 0)
     - NEVER create a matching exercise with only instructions but no items or options
  
  3. DIAGRAM/Visualization Instructions: For 'diagram_placeholder' type sections:
     - 'content' must contain COMPLETE, clear instructions for what students should draw
     - Instructions must be full sentences with proper endings
     - Example: "Draw a circle divided into 8 equal slices. Shade 4 of them to represent 4/8." (NOT: "Draw a circle divided into 8 equal slices. Shade 4")
  
  4. TEXT FORMATTING: Use plain text only. NO HTML entities (no &gt;, &lt;, &amp;, etc.). Use proper characters instead (use → not &gt;, use < not &lt;, etc.)
  
  5. ANSWERS: For all questions, matching exercises, and activities, you MUST include correct answers in the 'correctAnswer' field:
     - Multiple choice: use the option index (0, 1, 2, etc.)
     - Matching: provide an array of indices mapping items to options
     - Short answer: provide the expected answer text
     - Diagram: provide a brief description of what should be drawn
  
  6. COMPLETENESS CHECK: Before finalizing each section, verify:
     - All sentences are complete
     - Matching exercises have both items (content) and options
     - Diagram instructions are complete thoughts
     - No HTML entities are used
     - All required fields are filled
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
    
    const suite = {
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

    // Generate rubric based on the completed document
    try {
      const rubric = await generateRubric(suite, node, bloomLevel, gradeLevel, standards);
      suite.rubric = rubric;
    } catch (error) {
      console.warn('Failed to generate rubric:', error);
      // Continue without rubric if generation fails
    }
    
    return suite;
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

/**
 * Generate a grading rubric based on the completed instructional suite
 */
export const generateRubric = async (
  suite: InstructionalSuite,
  node: CurriculumNode,
  bloomLevel: BloomLevel,
  gradeLevel?: GradeLevel,
  standards?: EducationalStandard[]
): Promise<Rubric> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  // Summarize the suite content for rubric generation
  const sectionsSummary = suite.sections
    .slice(0, 10) // Limit to first 10 sections to avoid token limits
    .map(s => `${s.title}: ${s.type} (${s.points || 0} points)`)
    .join('\n');

  const standardsText = standards && standards.length > 0
    ? `\n\nAligned Standards:\n${standards.map(s => `- ${s.code}: ${s.description}`).join('\n')}`
    : '';

  const prompt = `You are an expert educator creating a grading rubric for student work on this ${suite.outputType}.

Topic: ${node.title}
Learning Objectives: ${node.learningObjectives.join(', ')}
Grade Level: ${gradeLevel || 'General'}
Bloom's Taxonomy Level: ${bloomLevel}${standardsText}

Content Summary:
${sectionsSummary}

Create a comprehensive grading rubric with 3-5 criteria that align with the learning objectives and content. Each criterion should have 4 performance levels:
- Excellent (4 points or highest level)
- Good (3 points or high level)
- Satisfactory (2 points or acceptable level)
- Needs Improvement (1 point or basic level)

Make the rubric specific, measurable, and aligned with the ${bloomLevel} cognitive level. Criteria should evaluate:
1. Understanding/mastery of key concepts
2. Quality of responses/work
3. Completeness
4. Additional relevant criteria based on the material type

Return the rubric in the requested JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            criteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING },
                  excellent: { type: Type.STRING },
                  good: { type: Type.STRING },
                  satisfactory: { type: Type.STRING },
                  needsImprovement: { type: Type.STRING },
                  points: { type: Type.NUMBER }
                },
                required: ["criterion", "excellent", "good", "satisfactory", "needsImprovement", "points"]
              }
            },
            totalPoints: { type: Type.NUMBER },
            scale: { type: Type.STRING }
          },
          required: ["criteria", "totalPoints"]
        }
      }
    });

    const rubric = JSON.parse(response.text || '{}');
    
    // Ensure points are set if not provided
    if (!rubric.totalPoints && rubric.criteria) {
      rubric.totalPoints = rubric.criteria.reduce((sum: number, c: any) => sum + (c.points || 4), 0);
    }
    
    return rubric;
  } catch (error: any) {
    console.error('Error generating rubric:', error);
    throw new Error(`Failed to generate rubric: ${error.message}`);
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
