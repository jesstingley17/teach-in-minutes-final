/**
 * AI Prompt Templates Library
 * 
 * Ready-to-use System + User prompt templates for OpenAI, Claude, and Gemini.
 * Based on AI_PROMPTS.md
 */

export const JSON_SCHEMA_SNIPPET = `{
  "pages": [
    {
      "title": "string",
      "grade": "string",
      "objectives": ["string"],
      "readingLevel": "string",
      "sections": [
        {
          "type": "warmup|practice|matching|diagram|explain|assessment",
          "minutes": integer,
          "instructions": "string",
          "items": [
            {
              "id": "string",
              "prompt": "string",
              "choices": ["string"],
              "correctIndex": integer,
              "explanation": "string"
            }
          ]
        }
      ]
    }
  ],
  "teacherKey": [
    {
      "pageIndex": integer,
      "sectionIndex": integer,
      "itemId": "string",
      "correctIndex": integer,
      "explanation": "string"
    }
  ],
  "metadata": {
    "sourcePromptId": "string",
    "modelUsed": "string",
    "generationTimeSec": number
  }
}`;

// ============================================================================
// 1. WORKSHEET GENERATION PROMPTS
// ============================================================================

export const WORKSHEET_GENERATION = {
  system: `You are an expert K-5 teacher and a strict JSON generator. Return ONLY valid JSON matching the provided schema. Do NOT include any commentary, markdown, or extra keys. Keep teacher explanations ≤ 50 words. If you cannot answer, return {"error":"clarify","message":"..."}.

Schema: ${JSON_SCHEMA_SNIPPET}`,
  
  user: (params: {
    grade: string;
    topic: string;
    objectives: string[];
    pageCount: number;
    sectionsPerPage: number;
    bloomLevel?: string;
    differentiation?: string;
    standards?: string;
  }) => `Generate a ${params.pageCount}-page worksheet for Grade ${params.grade} on "${params.topic}".

Include:
- ${params.objectives.length} objectives: ${params.objectives.join(', ')}
- readingLevel: Grade ${params.grade}
- ${params.sectionsPerPage} sections per page (minimum)
- Section types: warmup, practice, matching, diagram, assessment
- Provide teacherKey entries for all assessment items
${params.bloomLevel ? `- Target Bloom's Level: ${params.bloomLevel}` : ''}
${params.differentiation ? `- Differentiation: ${params.differentiation}` : ''}
${params.standards ? `- Aligned Standards: ${params.standards}` : ''}

Return ONLY valid JSON.`,
  
  temperature: 0.2,
  fewShot: `Example: Grade 2 addition, 1-page -> {"pages":[{"title":"Adding within 20","grade":"2","objectives":["Add within 20"],"readingLevel":"Grade 2","sections":[{"type":"warmup","minutes":3,"items":[{"id":"w1","prompt":"5+3=?","choices":[],"correctIndex":0,"explanation":"5+3=8"}]}]}]}`
};

export const QUICK_PREVIEW = {
  system: `You are a K-5 teacher producing a concise preview. Return JSON like the schema but keep sections short. This is a quick preview used for UI only. It's okay if some teacher explanations are placeholders.`,
  
  user: (params: {
    grade: string;
    topic: string;
    pageCount: number;
  }) => `Quickly draft a preview ${params.pageCount}-page Grade ${params.grade} worksheet on "${params.topic}" with 1 warmup, 2 practice items, and a 2-question assessment.`,
  
  temperature: 0.4
};

// ============================================================================
// 2. TEACHER KEY & DISTRACTOR RATIONALE
// ============================================================================

export const TEACHER_KEY_GENERATION = {
  system: `You are an assessment writer. For each multiple-choice question provide the correctIndex and a short teacher-facing explanation (≤30 words). For each distractor include a short rationale describing the misconception it targets. Return JSON only.`,
  
  user: (question: string, topic: string) => `Given question: "${question}" for topic "${topic}". Provide 3-4 choices and mark correctIndex. Distractors should target common errors (e.g., misunderstanding of operations, wrong units, reversed concepts).`,
  
  temperature: 0.2,
  fewShot: `Q: 1/2 of 10? -> choices: [5, 2, 8]; correctIndex:0; distractor rationale: "2 shows confusion between numerator and divisor."`
};

// ============================================================================
// 3. SUMMARIZATION PROMPTS
// ============================================================================

export const DOCUMENT_SUMMARIZATION = {
  system: `You are a conservative summarizer and pedagogy assistant. Condense the input document into 5 sections: Learning Goal, Key Concepts, Activities (3), Assessment Ideas (2), Differentiation (2). Return ONLY JSON: {sections:[{title,summary,keyPoints[],activities[]}],metadata:{originalWords,condensedWords}}. If a fact is not stated, mark it "not stated".`,
  
  user: (text: string, numSections: number = 5) => `Summarize the following curriculum text into ${numSections} sections. Ensure each summary is ≤60 words:\n\n${text.substring(0, 100000)}`,
  
  temperature: 0.1
};

// ============================================================================
// 4. SAFETY & PEDAGOGY AUDIT
// ============================================================================

export const SAFETY_AUDIT = {
  system: `You are a pedagogy and safety auditor. Evaluate the provided teacher-facing content for: age-appropriateness, bias, harmful/unsafe content, ambiguity, and clarity. Return ONLY JSON: {safe:boolean,issues:[{type,severity,excerpt,explanation}],recommendations:[{change,explanation}]}.`,
  
  user: (content: string, targetGrade: string) => `Audit this worksheet text for Grade ${targetGrade}:\n\n${content}`,
  
  temperature: 0.1,
  fewShot: `Input: "Name the woman who discovered X" for Grade 2 -> Output: {"safe":false,"issues":[{"type":"age_inappropriate","severity":"medium","excerpt":"Name the woman who discovered X","explanation":"Requires historical context that may confuse Grade 2 students."}],"recommendations":[{"change":"Rephrase to 'Who helped discover X? Provide a picture and simple hint.'","explanation":"Simpler language and context."}]}`
};

// ============================================================================
// 5. WORKED EXAMPLE GENERATOR
// ============================================================================

export const WORKED_EXAMPLE = {
  system: `You are a teacher that writes worked examples. For each problem, provide step-by-step solution and a short "common mistake" note. Return JSON: {problem,steps[],finalAnswer,commonMistake}.`,
  
  user: (problem: string, grade: string) => `Create a worked example for Grade ${grade}: "${problem}"`,
  
  temperature: 0.2,
  fewShot: `Problem: 3+4 -> steps: ["Add ones: 3+4=7"] finalAnswer:7 commonMistake:"Forgetting carry when crossing tens"`
};

// ============================================================================
// 6. READABILITY ADJUSTER
// ============================================================================

export const READABILITY_ADJUSTER = {
  system: `Rewrite the passage to a specified grade reading level. Return JSON: {original,rewritten,readingLevelEstimate}.`,
  
  user: (text: string, targetGrade: string) => `Rewrite this paragraph for Grade ${targetGrade}:\n\n${text}`,
  
  temperature: 0.2
};

// ============================================================================
// 7. RETRY HANDLER (for invalid JSON)
// ============================================================================

export const JSON_RETRY = {
  system: (schema: string) => `If the previous output was invalid JSON, re-generate the EXACT CORRECT JSON only. Do not include any other text. Schema: ${schema}`,
  
  user: (originalPrompt: string, invalidOutput: string) => `The previous response was invalid JSON. Please try again and return ONLY valid JSON.\n\nOriginal request: ${originalPrompt}\n\nInvalid output (for reference): ${invalidOutput.substring(0, 500)}`,
  
  temperature: 0.1
};

// ============================================================================
// 8. DIFFERENTIATION GENERATOR
// ============================================================================

export const DIFFERENTIATION_GENERATOR = {
  system: `You are an adaptive lesson designer. Produce three difficulty tiers for the same learning objective: Remedial, On-level, Challenge. Return JSON: {tiers:[{level,activities[],assessment[]}]}.`,
  
  user: (topic: string, grade: string) => `Create three tiers for Grade ${grade} lesson on "${topic}".`,
  
  temperature: 0.3
};

// ============================================================================
// 9. DIAGRAM INTERPRETATION (Gemini Vision)
// ============================================================================

export const DIAGRAM_ANALYSIS = {
  system: `You are a visual analyst. Given an image and optional OCR text, return ONLY JSON: {elements:[{id,type(label|shape|text),label,confidence,bbox?}],issues:[{id,problem,confidence}],suggestions:[{hint,gradeLevel}],caveats:[string]}.`,
  
  user: (description: string, grade: string) => `Analyze the uploaded student diagram: "${description}" for Grade ${grade}. Identify labels and any mislabeled parts. Provide 3 kid-friendly correction hints.`,
  
  temperature: 0.2
};

// ============================================================================
// 10. LESSON PLAN GENERATOR
// ============================================================================

export const LESSON_PLAN = {
  system: `You are an experienced teacher. Produce a 15-minute lesson plan with: objective, 3 activities (with minutes), required materials, and a short teachable script for the teacher (≤300 words). Return JSON.`,
  
  user: (topic: string, grade: string) => `Create a 15-minute lesson for Grade ${grade} on "${topic}".`,
  
  temperature: 0.4
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build a complete prompt with few-shot example if provided
 */
export const buildPrompt = (
  system: string,
  user: string,
  fewShot?: string
): { system: string; user: string } => {
  let enhancedSystem = system;
  
  if (fewShot) {
    enhancedSystem += `\n\nFew-shot example:\n${fewShot}`;
  }
  
  return {
    system: enhancedSystem,
    user: user
  };
};

/**
 * Get retry prompt for invalid JSON
 */
export const getRetryPrompt = (
  originalSystem: string,
  originalUser: string,
  invalidOutput: string,
  schema?: string
): { system: string; user: string } => {
  const retrySystem = JSON_RETRY.system(schema || JSON_SCHEMA_SNIPPET);
  const retryUser = JSON_RETRY.user(originalUser, invalidOutput);
  
  return {
    system: retrySystem,
    user: retryUser
  };
};



