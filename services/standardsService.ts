import { GoogleGenAI, Type } from "@google/genai";
import { EducationalStandard, StandardsFramework, GradeLevel, CurriculumNode } from "../types";
import { parseJSON } from "../utils/jsonValidator";

export class StandardsService {
  /**
   * Fetch and identify relevant educational standards using Gemini
   */
  static async fetchStandards(
    topic: string,
    description: string,
    learningObjectives: string[],
    gradeLevel: GradeLevel,
    framework: StandardsFramework
  ): Promise<EducationalStandard[]> {
    const apiKey = import.meta.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build context about the standards framework
    const frameworkContext = this.getFrameworkContext(framework);

    const prompt = `You are an expert in educational standards alignment. Based on the following educational content, identify the most relevant ${framework} standards for ${gradeLevel}.

Topic: ${topic}
Description: ${description}
Learning Objectives: ${learningObjectives.join('; ')}

${frameworkContext}

Please identify the specific standards that align with this content. For each standard, provide:
1. The official standard code/identifier
2. The full text description of the standard
3. The subject area (if applicable)

Return the standards as a JSON array.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING, description: "The standard code/identifier (e.g., CCSS.MATH.CONTENT.3.OA.A.1)" },
                description: { type: Type.STRING, description: "Full text description of the standard" },
                subject: { type: Type.STRING, description: "Subject area (Math, ELA, Science, etc.)" }
              },
              required: ["code", "description"]
            }
          }
        }
      });

      // Handle case where response.text might already be an object
      const responseData = response.text || '[]';
      const parseResult = parseJSON(responseData);
      
      if (!parseResult.valid) {
        console.error('JSON Parse Error for standards:', parseResult.error);
        // Return empty array on parse error rather than failing completely
        return [];
      }
      
      const standards: any[] = Array.isArray(parseResult.data) ? parseResult.data : [];
      
      return standards.map(std => ({
        code: std.code,
        description: std.description,
        framework: framework,
        subject: std.subject
      }));
    } catch (error: any) {
      console.error('Error fetching standards:', error);
      // Return empty array on error rather than failing completely
      return [];
    }
  }

  /**
   * Get context/instructions for specific standards frameworks
   */
  private static getFrameworkContext(framework: StandardsFramework): string {
    const contexts: Record<StandardsFramework, string> = {
      [StandardsFramework.COMMON_CORE_MATH]: `
Common Core State Standards for Mathematics:
- Use format: CCSS.MATH.CONTENT.[DOMAIN].[GRADE].[STANDARD]
- Domains include: Counting & Cardinality, Operations & Algebraic Thinking, Number & Operations, Measurement & Data, Geometry
- Include the full standard text and code
- Focus on standards that directly align with the learning objectives`,

      [StandardsFramework.COMMON_CORE_ELA]: `
Common Core State Standards for English Language Arts:
- Use format: CCSS.ELA-LITERACY.[STRAND].[GRADE].[STANDARD]
- Strands include: Reading, Writing, Speaking & Listening, Language
- Include the full standard text and code
- Focus on standards that directly align with the learning objectives`,

      [StandardsFramework.NGSS]: `
Next Generation Science Standards (NGSS):
- Use format: [GRADE]-[DISCIPLINARY CORE IDEA]-[PRACTICE]
- Include Performance Expectations (PE) codes
- Include full standard descriptions
- Focus on standards that align with the scientific content`,

      [StandardsFramework.STATE_TEXAS]: `
Texas Essential Knowledge and Skills (TEKS):
- Use format: [SUBJECT].[GRADE].[STRAND].[KNOWLEDGE/SKILL NUMBER]
- Include full TEKS statement
- Focus on TEKS that align with the content`,

      [StandardsFramework.STATE_CALIFORNIA]: `
California State Standards:
- Use format appropriate for the subject area
- Include full standard descriptions
- Focus on standards that align with the content`,

      [StandardsFramework.STATE_FLORIDA]: `
Florida State Standards (B.E.S.T. or previous standards):
- Use format appropriate for the subject area
- Include full standard descriptions
- Focus on standards that align with the content`,

      [StandardsFramework.STATE_NEW_YORK]: `
New York State Learning Standards:
- Use format appropriate for the subject area
- Include full standard descriptions
- Focus on standards that align with the content`,

      [StandardsFramework.INTERNATIONAL_BAC]: `
International Baccalaureate (IB) Standards:
- Use format appropriate for IB program (PYP, MYP, DP)
- Include full standard/objective descriptions
- Focus on IB standards that align with the content`,

      [StandardsFramework.AP]: `
Advanced Placement (AP) Standards:
- Use format: AP-[SUBJECT]-[TOPIC/LEARNING OBJECTIVE]
- Include full learning objective descriptions
- Focus on AP standards that align with the content`,

      [StandardsFramework.CUSTOM]: `
Custom/Other Educational Standards:
- Provide the standard code format used by your institution
- Include full standard descriptions
- Focus on standards that align with the content`
    };

    return contexts[framework] || '';
  }

  /**
   * Format standards for display
   */
  static formatStandardsForDisplay(standards: EducationalStandard[]): string {
    if (standards.length === 0) return '';
    
    return standards.map(std => `${std.code}: ${std.description}`).join('\n\n');
  }
}

