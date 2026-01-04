
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { BloomLevel, Differentiation, OutputType, AestheticStyle, InstructionalSuite, CurriculumNode, GradeLevel, EducationalStandard, Rubric, StandardsFramework, DocumentSection } from "../types";
import { parseJSON } from "../utils/jsonValidator";

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

    // Get response text from Gemini API
    const responseData = response.response.text() || '[]';
    const parseResult = parseJSON(responseData);
    
    if (!parseResult.valid) {
      console.error('JSON Parse Error:', parseResult.error);
      throw new Error(`Invalid JSON response from API: ${parseResult.error}. Please try again.`);
    }
    
    return parseResult.data;
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

    // Get response text from Gemini API
    const responseData = response.response.text() || '[]';
    const parseResult = parseJSON(responseData);
    
    if (!parseResult.valid) {
      console.error('JSON Parse Error:', parseResult.error);
      throw new Error(`Invalid JSON response from API: ${parseResult.error}. Please try again.`);
    }
    
    return parseResult.data;
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
  standards?: EducationalStandard[],
  visualType?: 'doodles' | 'diagrams' | 'both'
): Promise<InstructionalSuite> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
  }
  
  console.log('Generating suite with API Key configured:', apiKey ? 'Yes' : 'No');
  
  const ai = new GoogleGenAI({ apiKey });

  // Calculate sections per page - ensure adequate content density
  // For guided notes, we want more sections per page to ensure rich content
  const sectionsPerPage = pageCount === 1 ? 12 
    : pageCount <= 3 ? 10 
    : pageCount <= 5 ? 9 
    : pageCount <= 10 ? 10  // Increase for 6-10 pages to ensure good coverage
    : 8; // For very long documents, slightly less per page
  const totalSections = pageCount * sectionsPerPage;
  
  // Scale content mix requirements based on total sections needed
  const scaleFactor = Math.max(1, Math.ceil(totalSections / 25)); // Base is ~25 sections
  const instructionalSections = Math.max(3, Math.ceil(4 * scaleFactor));
  const guidedPracticeSections = Math.max(3, Math.ceil(4 * scaleFactor));
  const diagramSections = Math.max(2, Math.ceil(2 * scaleFactor));
  const multipleChoiceSections = Math.max(2, Math.ceil(3 * scaleFactor));
  const shortAnswerSections = Math.max(3, Math.ceil(4 * scaleFactor));
  const matchingSections = Math.max(1, Math.ceil(2 * scaleFactor));
  const independentPracticeSections = Math.max(2, Math.ceil(3 * scaleFactor));
  
  // Log the section requirements for debugging
  console.log(`Generating ${pageCount} pages: ${totalSections} total sections (${sectionsPerPage} per page)`);
  console.log(`Content mix: ${instructionalSections} instructional, ${guidedPracticeSections} guided practice, ${diagramSections} diagrams, ${multipleChoiceSections} multiple choice, ${shortAnswerSections} short answer, ${matchingSections} matching, ${independentPracticeSections} independent practice`);
  
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
  
  The output should be high-fidelity, pedagogically sound, professionally designed, and ready for immediate classroom use. Generate SUBSTANTIAL, COMPREHENSIVE content that fully utilizes all ${pageCount} page${pageCount > 1 ? 's' : ''}.
  
  ⚠️ CRITICAL: You MUST generate EXACTLY ${totalSections} sections (${sectionsPerPage} sections per page × ${pageCount} pages). This is NOT optional - you MUST reach this exact count. Each section must be substantial, meaningful, professionally crafted, and contain full, complete content (not brief summaries).
  
  CONTENT MIX (Scaled for ${pageCount} pages - MUST total ${totalSections} sections):
  - Instructional content with worked examples: ${instructionalSections} sections MINIMUM - Include multiple complete worked examples with full explanations. For ${pageCount} pages, distribute these across all pages.
  - Guided practice with sentence frames/scaffolding: ${guidedPracticeSections} sections MINIMUM - Provide extensive practice opportunities distributed across pages
  - Diagram/visualization with explicit teacher directions: ${diagramSections} sections MINIMUM (type: 'diagram_placeholder') - ⚠️ REQUIRED: You MUST create exactly ${diagramSections} sections with type 'diagram_placeholder'. These are visual learning opportunities where students draw diagrams. Spread across pages.${visualType === 'diagrams' || visualType === 'both' ? ' CRITICAL: Visual type is set to diagrams or both - ensure you generate ALL requested diagram_placeholder sections with clear, complete drawing instructions.' : ''}
  - Multiple choice questions: ${multipleChoiceSections} sections MINIMUM - Use thoughtfully, focus on conceptual understanding, distribute across pages
  - Short answer with think-aloud prompts: ${shortAnswerSections} sections MINIMUM - Encourage deep thinking, spread across all pages
  - Matching exercises: ${matchingSections} sections MINIMUM - MUST include complete options array with multiple items, distribute across pages
  - Independent practice problems: ${independentPracticeSections} sections MINIMUM - Substantial practice opportunities on every page
  - Challenge extension: ${Math.ceil(scaleFactor)} section(s), clearly marked - Optional enrichment for advanced learners
  - Remediation option: ${Math.ceil(scaleFactor)} section(s), clearly marked - Extra support for struggling learners
  
  REMEMBER: The total MUST equal ${totalSections} sections. If the minimums above don't add up to ${totalSections}, you MUST add more sections of any type to reach the exact count. Distribute content evenly across all ${pageCount} pages.
  
  Each section must contain COMPLETE, SUBSTANTIAL content. Do not create brief or minimal sections. Think of this as a comprehensive learning resource that students will work through thoroughly.
  
  For ${differentiation}, ensure:
  - ADHD: Clear headers, chunked information, visual cues, generous white space, visual anchors.
  - ESL: Simplified phrasing, vocabulary focus, visual scaffolding, sentence frames.
  - Gifted: Challenge extensions, higher complexity, open-ended inquiries, synthesis tasks.
  
  Generate COMPREHENSIVE, SUBSTANTIAL content that FULLY utilizes all ${pageCount} page${pageCount > 1 ? 's' : ''} of material. This should be a COMPLETE learning resource with ample practice, examples, and activities. Do not create minimal or brief content - generate thorough, detailed sections that provide students with comprehensive learning opportunities. Each section should be well-developed with complete explanations, multiple examples, and substantial practice opportunities.
  
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
     - CRITICAL: You MUST include diagram_placeholder sections as specified in the content mix. These are REQUIRED, not optional.
  
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
        thinkingConfig: { thinkingBudget: 500 }, // Reduced from 2000 for faster generation
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
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { 
                    // Note: No type specified to allow mixed types (number for MC, array for matching, string for short answer)
                    // Gemini API doesn't support oneOf/anyOf, so field is returned as untyped/any - requires runtime type checking
                    description: "The correct answer for questions/matching. For multiple choice: use NUMBER index (0,1,2...). For matching: use ARRAY of numbers like [0,1,2]. For short answer: use STRING text."
                  },
                  explanation: { 
                    type: Type.STRING,
                    description: "Optional explanation for why this is the correct answer"
                  }
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

    // Use JSON validator to handle malformed JSON gracefully
    // Get response text from Gemini API
    const responseData = response.response.text() || '{}';
    const parseResult = parseJSON(responseData);
    
    if (!parseResult.valid) {
      console.error('JSON Parse Error:', parseResult.error);
      const responseStr = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
      console.error('Response data (first 1000 chars):', responseStr.substring(0, 1000));
      console.error('Response data type:', typeof responseData);
      console.error('Response data length:', typeof responseData === 'string' ? responseData.length : 'N/A (object)');
      
      // Try to find the position of the error in the response
      if (parseResult.error?.includes('position')) {
        const match = parseResult.error.match(/position (\d+)/);
        if (match && typeof responseData === 'string') {
          const pos = parseInt(match[1]);
          const start = Math.max(0, pos - 100);
          const end = Math.min(responseData.length, pos + 100);
          console.error('Error context:', responseData.substring(start, end));
        }
      }
      
      throw new Error(`Invalid JSON response from API: ${parseResult.error}. The API may have returned malformed JSON. Please try again.`);
    }
    
    const rawData = parseResult.data;
    
    // Ensure we have enough sections
    const sections = rawData.sections || [];
    
    // Log sections with answers for debugging
    const sectionsWithAnswers = sections.filter((s: any) => s.correctAnswer !== undefined);
    if (sectionsWithAnswers.length > 0) {
      console.log(`Generated ${sectionsWithAnswers.length} sections with correctAnswer fields`);
    } else {
      console.warn('WARNING: No sections have correctAnswer fields. Teacher key will be empty.');
    }
    
    // Build teacher key from sections with answers
    const teacherKey = sections
      .filter((s: any) => s.correctAnswer !== undefined)
      .map((s: any) => ({
        sectionId: s.id,
        sectionTitle: s.title,
        answer: s.correctAnswer,
        explanation: s.explanation
      }));
    
    if (teacherKey.length > 0) {
      console.log(`Built teacher key with ${teacherKey.length} entries`);
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
      teacherKey: teacherKey.length > 0 ? teacherKey : undefined,
      pageCount: pageCount,
      gradeLevel: gradeLevel,
      standards: standards,
      showStandards: true,
    };

    // Generate rubric asynchronously (non-blocking) for better performance
    // Rubric will be added later if needed, but doesn't block suite return
    generateRubric(suite, node, bloomLevel, gradeLevel, standards)
      .then(rubric => {
      suite.rubric = rubric;
        console.log('Rubric generated and added to suite');
      })
      .catch(error => {
        console.warn('Failed to generate rubric (non-blocking):', error);
      // Continue without rubric if generation fails
      });
    
    return suite;
  } catch (error: any) {
    console.error('Gemini API Error Details:', {
      message: error.message,
      status: error.status,
      details: error.details,
      fullError: error
    });
    
    let errorMessage = 'Generation failed. ';
    
    // Check if it's a JSON parsing error
    if (error.message?.includes('Invalid JSON') || error.message?.includes('JSON') || error.message?.includes('Expected')) {
      errorMessage += 'The API returned invalid JSON. This may be due to malformed content in the response. Please try again. If the issue persists, the content may be too complex or contain special characters that break JSON formatting.';
    } else if (error.message?.includes('billing') || error.status === 403) {
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
 * Generate answers for questions that don't have correctAnswer set
 */
export const generateAnswers = async (
  sections: DocumentSection[],
  topic: string,
  gradeLevel?: GradeLevel,
  bloomLevel?: BloomLevel
): Promise<DocumentSection[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please check your environment variables.');
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Filter sections that need answers
  const questionsNeedingAnswers = sections.filter(s => 
    (s.type === 'question' || s.type === 'matching') && 
    s.correctAnswer === undefined
  );
  
  if (questionsNeedingAnswers.length === 0) {
    return sections; // No answers needed
  }
  
  try {
    const prompt = `You are an expert teacher creating answer keys. Generate correct answers for the following questions from an educational material about "${topic}".

${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
${bloomLevel ? `Bloom's Taxonomy Level: ${bloomLevel}` : ''}

For each question, provide the correct answer in the appropriate format:
- Multiple choice questions: Return the INDEX (0, 1, 2, etc.) of the correct option
- Short answer questions: Return the answer as a STRING
- Matching exercises: Return an ARRAY of indices like [0, 1, 2] mapping each item to its matching option

Return a JSON object where each key is the section ID and the value is the correct answer.

Questions:
${questionsNeedingAnswers.map((s, idx) => {
  let questionText = `${idx + 1}. [ID: ${s.id}] ${s.title}\n${s.content}`;
  if (s.options && s.options.length > 0) {
    questionText += `\nOptions:\n${s.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`;
  }
  if (s.type === 'matching' && s.content) {
    questionText += `\nItems to match:\n${s.content.split('\n').filter(l => l.trim()).map((l, i) => `  ${i + 1}. ${l.trim()}`).join('\n')}`;
    if (s.options) {
      questionText += `\nWord Bank:\n${s.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`;
    }
  }
  return questionText;
}).join('\n\n')}

Return ONLY a JSON object in this format:
{
  "section-id-1": <answer>,
  "section-id-2": <answer>,
  ...
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.response.text();
    const parseResult = parseJSON(responseText);

    if (!parseResult.valid || !parseResult.data) {
      throw new Error(`Invalid response format from AI: ${parseResult.error || 'Failed to parse JSON'}`);
    }

    const answers = parseResult.data;

    if (!answers || typeof answers !== 'object') {
      throw new Error('Invalid response format from AI');
    }

    // Update sections with generated answers
    const updatedSections = sections.map(section => {
      if (section.correctAnswer === undefined && answers[section.id] !== undefined) {
        return {
          ...section,
          correctAnswer: answers[section.id]
        };
      }
      return section;
    });

    return updatedSections;
  } catch (error: any) {
    console.error('Error generating answers:', error);
    throw new Error(`Failed to generate answers: ${error.message || 'Unknown error'}`);
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

    // Get response text from Gemini API
    const responseData = response.response.text() || '{}';
    const parseResult = parseJSON(responseData);
    
    if (!parseResult.valid) {
      console.error('JSON Parse Error for rubric:', parseResult.error);
      throw new Error(`Invalid JSON response for rubric: ${parseResult.error}. Please try again.`);
    }
    
    const rubric = parseResult.data;
    
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
    console.log('Generating doodle for:', node.title);
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Use available model
      contents: [
        { text: `Create a single, clean, minimalistic black and white line-art doodle or icon representing: ${node.title}. The background must be pure white. No shading, just outlines. Suitable for a professional academic worksheet.` }
      ],
      config: {
        responseMimeType: "image/png"
      }
    });
    
    console.log('Doodle generation response received');
    
    // Check for image data in response
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('Doodle generated successfully');
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    // Alternative: check if response has text method containing base64 image data
    try {
      const responseText = response.response?.text();
      if (responseText) {
        // Try to extract base64 image from response text
        const base64Match = responseText.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
        if (base64Match) {
          console.log('Doodle extracted from text response');
          return base64Match[0];
        }
      }
    } catch (e) {
      // Ignore if text() method doesn't exist or fails
    }
    
    console.warn('No image data found in doodle response');
    return '';
  } catch (error: any) {
    console.error('Doodle generation failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      details: error.details
    });
    // Non-critical, just return empty string
    return '';
  }
};

/**
 * Generate diagrams for sections that have type 'diagram_placeholder'
 * Returns updated sections with imageBase64 populated
 */
export const generateDiagrams = async (
  sections: DocumentSection[],
  topic: string
): Promise<DocumentSection[]> => {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, skipping diagram generation');
    return sections;
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Find all diagram placeholder sections
  const diagramSections = sections.filter(s => s.type === 'diagram_placeholder' && !s.imageBase64);
  
  if (diagramSections.length === 0) {
    console.log('No diagram placeholders found or all already have images');
    return sections;
  }
  
  console.log(`Generating ${diagramSections.length} diagrams for topic: ${topic}`);
  
  // Generate diagrams for each section
  const updatedSections = [...sections];
  
  for (const section of diagramSections) {
    try {
      console.log(`Generating diagram for: ${section.title}`);
      
      const prompt = `Create a clear, educational diagram illustrating: ${section.content}. 
Topic context: ${topic}. 
Requirements:
- Simple, clean line art suitable for educational materials
- Clear labels and annotations
- Black lines on white background
- Easy to understand for students
- Professional academic style`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "image/png"
        }
      });
      
      // Extract image data
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageData = `data:image/png;base64,${part.inlineData.data}`;
            
            // Find and update the section
            const sectionIndex = updatedSections.findIndex(s => s.id === section.id);
            if (sectionIndex !== -1) {
              updatedSections[sectionIndex] = {
                ...updatedSections[sectionIndex],
                imageBase64: imageData
              };
              console.log(`Diagram generated successfully for section: ${section.title}`);
            }
            break;
          }
        }
      } else {
        console.warn(`No diagram generated for section: ${section.title}`);
      }
    } catch (error: any) {
      console.error(`Failed to generate diagram for section ${section.title}:`, error);
      // Continue with other diagrams even if one fails
    }
  }
  
  return updatedSections;
};
