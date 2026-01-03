
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
    ? `CRITICAL GUIDED NOTES REQUIREMENTS - Professional Classroom-Ready Level:

1. OPENING HOOK - Make it sticky and frame future payoff:
   - Start with a hook that signals why this lesson matters beyond today
   - Include one sentence about future payoff or how this connects to bigger learning
   - Example: "Understanding like denominators is the foundation for all fraction addition and subtraction you'll do later — this is the rule everything else builds on."
   - Position the lesson as a key concept, not just a task

2. PEDAGOGICAL STRUCTURE - Use "I Do → We Do → You Do" framework:
   - I Do: Start with 1-2 worked examples with complete solutions shown step-by-step
   - We Do: Include guided practice with sentence frames, scaffolding, and partial solutions
   - You Do: Independent practice with clear instructions
   - Add visual hierarchy: Use section headers like "Vocabulary", "Why This Works", "Try It"

3. VISUAL INSTRUCTION CLARITY - Reduce cognitive load:
   - Break long instruction blocks into action beats with visual cues
   - Use emoji/icon cues when appropriate: 🖍 Draw, ✏️ Label, 👀 Notice
   - Labeled diagram placeholders with explicit teacher directions
   - Include 1-2 fully worked examples BEFORE independent practice
   - Diagram instructions should be complete sentences outside the drawing box
   - Make instructions scannable, not just readable

4. COGNITIVE DEPTH - Push reasoning deeper:
   - Sentence frames should invite explanation, not just one-word answers
   - Add forced reasoning clauses: "because the parts are the same size, which means __________."
   - Move from recall → explanation
   - Use think-aloud prompts: "Think about: Why can't we add 1/2 and 1/3 directly?"
   - Include "Why It Matters" connections with clear headers

5. MULTIPLE CHOICE - Expose misconceptions:
   - Include at least one option that sounds tempting but wrong (common misconceptions)
   - Make errors teachable, not silent
   - Example: Include an option like "7/24 because we add everything" to catch students who add denominators

6. DIFFERENTIATION WITH VISUAL BADGES:
   - Challenge extension: Mark clearly with visual badge like "⭐ Preview of What's Next" or "Challenge:"
   - Remediation option: Mark clearly with "💡 Extra Help:" or "Support Option:"
   - Signal curriculum coherence and vertical alignment
   - Do NOT increase page length - integrate seamlessly

7. VISUAL HIERARCHY & AUTHORITY:
   - Add subtle section headers with clear hierarchy
   - Increase white space around worked examples (visual breathing room)
   - Add one boxed "Golden Rule" statement for key concepts (e.g., "Golden Rule: When denominators are the same, only the numerators change.")
   - Make it look like premium curriculum, not "AI-assisted notes"
   - Use visual structure to separate instruction from practice

8. ACCESSIBILITY OPTIMIZATION:
   - ADHD-friendly: Generous white space, clear visual anchors, chunked information, icon cues
   - Dyslexia-friendly: Clear spacing, visual breaks, avoid dense text blocks, scannable format
   - Print-safe margins (20mm), intentional white space between sections
   - Multi-page format with clear page breaks

9. CONTENT QUALITY:
   - NO fluff - every element serves a learning purpose
   - Maintain rigor while being accessible
   - Natural teacher voice, not robotic
   - Clear progression from concept introduction → practice → application`
    : `CRITICAL WORKSHEET REQUIREMENTS - Professional Classroom-Ready Level:

1. OPENING HOOK - Make it sticky:
   - Start with a hook that signals why this lesson matters beyond today
   - Include one sentence about future payoff or how this connects to bigger learning
   - Example: "Understanding like denominators is the foundation for all fraction addition and subtraction you'll do later — this is the rule everything else builds on."
   - Position the lesson as a key concept, not just a task

2. PEDAGOGICAL STRUCTURE - Use "I Do → We Do → You Do" framework:
   - I Do: Start with 1-2 worked examples with complete solutions shown step-by-step
   - We Do: Include guided practice with sentence frames, scaffolding, and partial solutions
   - You Do: Independent practice with clear instructions
   - Add visual hierarchy: Use section headers like "Vocabulary", "Why This Works", "Try It"

3. WORKED EXAMPLES FIRST:
   - ALWAYS include 1-2 fully solved examples BEFORE independent practice questions
   - Show complete step-by-step solutions with explanations
   - Increase white space around worked examples for visual breathing room
   - Format: "Example: Add 1/5 + 2/5. Solution: Since both denominators are 5, we add the numerators: 1 + 2 = 3. The answer is 3/5."

4. VISUAL INSTRUCTIONS - Reduce cognitive load:
   - Break long instruction blocks into action beats with visual cues
   - Use emoji/icon cues when appropriate: 🖍 Draw, ✏️ Label, 👀 Notice
   - Make instructions scannable, not just readable
   - ALL diagram instructions must be complete sentences with proper endings
   - Be specific: "Draw two separate rectangles of equal size. Divide the first rectangle into 5 equal horizontal strips. Divide the second rectangle into 5 equal horizontal strips. Shade 2 strips in the first rectangle and 3 strips in the second rectangle to show 2/5 + 3/5."

5. COGNITIVE DEPTH - Push reasoning deeper:
   - Sentence frames should invite explanation, not just one-word answers
   - Add forced reasoning clauses: "because the parts are the same size, which means __________."
   - Move from recall → explanation
   - Include "why" explanations, not just "what"
   - Use think-aloud prompts: "Think about: Why can we add 1/5 and 2/5 but not 1/5 and 1/3?"

6. MULTIPLE CHOICE - Expose misconceptions:
   - Include at least one option that sounds tempting but wrong (common misconceptions)
   - Make errors teachable, not silent
   - Example: Include an option like "7/24 because we add everything" to catch students who add denominators
   - Surface student thinking through distractor quality

7. REDUCE REPETITION:
   - Avoid asking the same type of question multiple times (e.g., "identify the denominator" appears 3+ times)
   - Vary question types: multiple choice, short answer, matching, drawing, sentence completion
   - Each question should target a different aspect or skill level

8. COMPLETE MATCHING EXERCISES:
   - MUST include both items to match AND a complete word bank/options array
   - Never create matching exercises with only items but no options
   - Example: Items: "Numerator\nDenominator" Options: ["Top number of fraction", "Bottom number of fraction"]

9. DIFFERENTIATION WITH VISUAL BADGES:
   - Challenge extension: Mark clearly with visual badge like "⭐ Preview of What's Next" or "Challenge:"
   - Remediation option: Mark clearly with "💡 Extra Help:" or "Support Option:"
   - Signal curriculum coherence and vertical alignment
   - Integrate seamlessly without increasing page length

10. VISUAL HIERARCHY & AUTHORITY:
   - Add subtle section headers with clear hierarchy
   - Add one boxed "Golden Rule" statement for key concepts (e.g., "Golden Rule: When denominators are the same, only the numerators change.")
   - Make it look like premium curriculum, not "AI-assisted notes"
   - Use visual structure to separate instruction from practice

11. ACCESSIBILITY:
   - ADHD-friendly: Generous white space, clear visual anchors, chunked information, icon cues
   - Dyslexia-friendly: Clear spacing, visual breaks, avoid dense text blocks, scannable format
   - Print-safe margins (20mm), intentional white space

12. COMPLETE CONTENT:
   - NO truncated sentences, NO cut-off text, NO incomplete thoughts
   - Every section must be fully usable by students
   - All questions must have complete instructions`;

  const prompt = `Act as a world-class Instructional Designer and Curriculum Developer. Generate a professionally structured, classroom-ready ${outputType} for the topic: "${node.title}".
  
  Details:
  - Target Bloom's Taxonomy Level: ${bloomLevel}
  - Differentiation Strategy: ${differentiation}${gradeText}
  - Learning Objectives: ${node.learningObjectives.join(', ')}
  - Topic Description: ${node.description}
  - Target Pages: ${pageCount} pages (MUST generate EXACTLY ${totalSections} sections minimum)${standardsText}
  
  ${outputTypeInstructions}
  
  The output should be high-fidelity, pedagogically sound, professionally designed, and ready for immediate classroom use. Quality over quantity - every section must serve a clear learning purpose.
  
  MANDATORY: You MUST generate AT LEAST ${totalSections} sections. This is a minimum requirement, not a suggestion. Each section should be substantial, meaningful, and professionally crafted.
  
  CONTENT MIX (Professional Distribution):
  - Instructional content with worked examples (2-3 sections) - Include at least 1-2 complete worked examples
  - Guided practice with sentence frames/scaffolding (2-3 sections)
  - Diagram/visualization with explicit teacher directions (1-2 sections)
  - Multiple choice questions (1-2 sections) - Use sparingly, focus on conceptual understanding
  - Short answer with think-aloud prompts (2-3 sections)
  - Matching exercises (1 section) - MUST include complete options array
  - Independent practice problems (1-2 sections)
  - Challenge extension (1 section, clearly marked) - Optional enrichment
  - Remediation option (1 section, clearly marked) - Extra support for struggling learners
  
  For ${differentiation}, ensure:
  - ADHD: Clear headers, chunked information, visual cues, generous white space, visual anchors.
  - ESL: Simplified phrasing, vocabulary focus, visual scaffolding, sentence frames.
  - Gifted: Challenge extensions, higher complexity, open-ended inquiries, synthesis tasks.
  
  Generate comprehensive, substantial content that fully utilizes ${pageCount} page${pageCount > 1 ? 's' : ''} of material while maintaining professional spacing and visual clarity.
  
  CRITICAL REQUIREMENTS - READ CAREFULLY:
  
  ⚠️ ANSWERS ARE REQUIRED: For EVERY question and matching exercise, you MUST include a 'correctAnswer' field in the JSON output. This field is essential for the teacher key. The format depends on question type:
     - Multiple choice questions: correctAnswer must be a NUMBER (0, 1, 2, etc.) representing the index of the correct option
     - Short answer questions: correctAnswer must be a STRING with the expected answer text
     - Matching exercises: correctAnswer must be an ARRAY of numbers like [0, 1, 2] mapping each item to its matching option index
     - Do NOT omit this field. Every question and matching section MUST have a correctAnswer.
  
  
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
    
    // Log sections with answers for debugging
    const sectionsWithAnswers = sections.filter((s: any) => s.correctAnswer !== undefined);
    if (sectionsWithAnswers.length > 0) {
      console.log(`Generated ${sectionsWithAnswers.length} sections with correctAnswer fields`);
    } else {
      console.warn('WARNING: No sections have correctAnswer fields. Teacher key will be empty.');
    }
    
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
