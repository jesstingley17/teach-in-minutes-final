# AI Strategy Blueprint for ReclaimEdU

**Goals**: Maximize quality, safety, cost-effectiveness, and modularity for:
- Worksheet generation (structured JSON)
- Long-document summarization / condensation
- Teacher key & distractors
- Visual (image/diagram) interpretation
- RAG / fact grounding and verification
- Safety/moderation and auditing
- Embeddings/retrieval for Saved Drafts and RAG

## 1) Which Provider for What

### OpenAI (GPT family)
- **Best for**: High-quality creative content, structured JSON output, code generation, general-purpose text generation (final drafts, teacher-facing prose).

### Claude (Anthropic)
- **Best for**: Long-context summarization, iterative refinement, safety/moderation, conservative content auditing.

### Gemini (Google)
- **Best for**: Multimodal visual understanding (diagrams, layouts, image reasoning) and search-grounded verification when paired with Google Search.

### Embeddings
- Use OpenAI or Claude embeddings depending on contract; OpenAI embeddings are widely used; Claude embeddings are suitable if you want Anthropic stack consistency.

## 2) Core JSON Schema (Strict)

Use strict schema enforcement in the prompt (server should attempt to JSON.parse and reject non-conformant responses).

### Example: Worksheet Schema
```json
{
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
              "explanation": "string (teacher-facing)"
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
}
```

## 3) Unified Instructions for Every Generation Prompt

- Always include: schema, strictness ("Return ONLY valid JSON — no extra commentary"), temperature guidance, max tokens, style constraints.
- Provide 1–2 few-shot examples in the prompt body (short) matching the schema.
- Ask for a short teacher-facing summary (1 sentence) and an internal metadata field.

## 4) Prompt Templates (System + User) — Ready-to-Use, Per Provider

### A. Worksheet Generation — Final Draft (OpenAI Preferred)

**System (OpenAI)**:
```
You are an expert elementary teacher and a strict JSON formatter. Return ONLY valid JSON that matches this schema: [paste schema]. Do NOT include any commentary, markdown, or extraneous keys. Keep explanations concise (<40 words each). Use US grade labels (K, 1, 2, 3…).
```

**User**:
```
Generate a 1-page worksheet for Grade 3 on 'fractions as parts of a whole'. Include: title, 3 objectives, readingLevel (grade-level), a 3-minute warmup (1 question), two practice activities (one multiple-choice with plausible distractors that reflect common misconceptions), and a final 3-question assessment with correct answers and teacher explanations. Provide teacherKey entries for all assessment items.
```

**OpenAI Tuning**:
- temperature: 0–0.2 for assessments; 0.2–0.5 for activities wording.
- max_tokens: 1000–3000 depending on pages requested.

### B. Long-Document Summarization / Condensation (Claude Preferred)

**System (Claude)**:
```
You are a precise summarizer. Condense the input document into N teaching-ready sections. Output JSON using schema: {sections:[{title,summary(<=60 words),keyPoints:[],activities:[]}],metadata:{originalLengthWords}}. Return only valid JSON. Be conservative: do not invent facts; if something isn't present, say it is 'not stated' in the summary fields.
```

**User**:
```
Summarize this curriculum (paste text) into 5 sections: Learning Goal, Key Concepts, Activities (3), Assessment Ideas (2), Differentiation (2). Ensure each summary is ≤60 words.
```

**Claude Tuning**:
- temperature: 0–0.1 (focus on faithfulness).
- Use iterative refinement: first produce bullet summaries per chunk, then condense those.

### C. Teacher Key & Distractor Generation (OpenAI for Generation; Claude for Audit)

**System (OpenAI)**:
```
You are an assessment writer. For each multiple-choice question, return choices with plausible distractors tied to common misconceptions. Mark correctIndex and include a short explanation for teachers (≤50 words). Output as part of the main JSON schema only.
```

**User**:
```
For the following prompt/question: [question text], produce 3 distractors and mark the correct one. Distractors should be plausible errors (e.g., wrong operation, wrong unit, reversed numerator/denominator).
```

**Follow-up Safety/Audit**:
- Pass teacherKey entries to Claude with "Audit the answers and distractors for potential bias, ambiguity, or unsafe content. If flagged, return suggested edits in JSON."

### D. Visual Analysis / Diagram Interpretation (Gemini Preferred)

**System (Gemini)**:
```
You are a visual analyst. Accept an image and optional accompanying OCR/text. Return ONLY JSON with keys: elements[], issues[], suggestions[], boundingBoxesAllowed:true/false. elements: [{id,type(label|shape|text),label,confidence,boundingBox(Optional)}]. suggestions: [{problem,correction,hint,confidence}]. If unsure, set confidence<0.6 and include 'I don't know' style messaging in a 'caveat' field.
```

**User**:
```
Analyze the uploaded student diagram (image + OCR text). Identify labeled parts and any mistakes. Propose 3 short correction hints aimed at Grade 3 level.
```

**Gemini Tuning**:
- Ask for bounding boxes if you need layout conversion.
- Use OCR as a separate step if you want deterministic extraction (Google Vision or Tesseract), then feed OCR text + image to Gemini for interpretation.

### E. RAG / Fact-Check Verifier (Gemini + Search or OpenAI w/ Retrieved Context)

**System (both)**:
```
Use ONLY the provided retrieved documents. Cite sources inline as [1], [2]. If no answer present, return 'I don't know'. Output JSON: {answer, citations:[{id,url}],confidence}.
```

**User**:
```
Question: [user question]. Retrieved docs: [1: url + snippet], [2: url + snippet]. Answer using only these docs.
```

**Instruction**:
- Keep the retrieval window small and pass the most relevant snippets; prefer exact quoting for facts.

### F. Safety / Moderation / Pedagogy Audit (Claude Recommended)

**System (Claude)**:
```
You are a safety & pedagogy auditor. Evaluate content for: accuracy, safety (no harmful/offensive content), bias, age-appropriateness for the target grade, and pedagogical clarity. Return JSON: {issues:[{type,severity,reason}], recommendations:[{change,explanation}], safe:true|false}.
```

**User**:
```
Audit the following teacher-facing text: [text]. Target grade: 3. Return only the JSON.
```

## 5) Example Few-Shot Snippet

- Include one minimal example of a section and 1 item that exactly matches the schema to teach format.
- Keep few-shots small (1–2 examples) to conserve tokens.

## 6) Orchestration Patterns — Full Pipeline Examples

### A. Fast UX + High-Quality Final Generation (Recommended)

1. User requests new worksheet → quickDraft via cheaper OpenAI model (gives immediate preview).
2. Condense any attached long docs using Claude (summarize).
3. Final generate with higher-tier OpenAI model, using Claude summary as context.
4. Run safety/pedagogy audit with Claude.
5. If images provided, run OCR → Gemini visual analysis → feed results into step 3 as context.
6. Save final JSON and teacherKey to DB, embed with OpenAI/Claude embeddings for Search.

### B. RAG + Verification

1. Chunk & embed Curriculum docs (OpenAI embeddings).
2. Retrieve top-k chunks.
3. Condense chunks with Claude.
4. Generate worksheet (OpenAI).
5. For any factual claims, run Gemini with Search to confirm and attach citations.

## 7) Prompt-Engineering and Operational Tips

- Always require "Return ONLY valid JSON" and perform strict parse checks. If parse fails, retry once with a system message: "Previous response was invalid JSON. Try again and return only JSON exactly in the requested schema."
- **Temperature**: 0–0.2 for factual and assessment outputs; 0.2–0.6 for activities; 0.6–0.9 for creative prompts.
- **Few-shot**: include 1–2 compact examples to enforce formatting.
- **Max tokens**: set sufficiently high, but chunk long work into smaller pages to limit single-call cost.
- Use metadata to record modelUsed and promptVersion to support future audits.
- Rate-limit large jobs (PDF export / multi-page generation) and perform them asynchronously.
- Sanitize user-supplied input to avoid prompt injection; treat teacher-uploaded documents or images as untrusted and escape/whitelist content where possible.

## 8) Error Handling & Robustness

- Always validate JSON with a schema validator. If invalid:
  - Attempt one automatic re-prompt with the model: include the original response and say "The previous output was invalid JSON — produce only the corrected JSON."
  - If still invalid, fallback to a small deterministic rule-based generator for required fields (titles, placeholders) and flag to user: "Partial automated content — please review."
- For visual tasks: if confidence <0.6 for critical fields, show "uncertain" and ask user to confirm or provide clarification.

## 9) Logging, Monitoring, and Metrics

- **Log**: promptVersion, model, tokenUsage, latency, final JSON size, and any parse errors.
- **Metrics to collect**: parseSuccessRate, hallucinationRate (human-audited), latency (p95), costPerGeneration, teacherSatisfactionScore (user feedback).
- Implement sampling-based human review (e.g., 1–5% of outputs) for pedagogical quality.

## 10) Evaluation & Benchmark Plan (Quick)

Pick 3 representative tasks:
1. One-page worksheet generation (creative + structured)
2. Long-document -> 4-page worksheet (RAG + condensation)
3. Image interpretation (diagram error detection + suggestions)

For each model (OpenAI baseline, Claude, Gemini):
- Create 10 inputs per task.
- **Metrics**:
  - JSON parse success (automated)
  - Teacher correctness (human rated) — 1–5 scale
  - Factuality/hallucination count (automated where possible + manual)
  - Latency and cost
- Run A/B tests in prod for 1 week with small traffic to measure real-user satisfaction.

## 11) Security, Privacy & Compliance

- Strip PII before sending to APIs unless contract & enterprise plan allows compliant processing.
- Prefer server-side calls (do not call APIs directly from client).
- For student data, check provider data usage and retention policies; consider enterprise contracts or private endpoints.

## 12) TypeScript Integration Sketch

```typescript
// sketch: generateWorksheet()
async function generateWorksheet(request) {
  // 1. Quick draft (cheap OpenAI)
  const draft = await openai.generate({
    prompt: quickDraftPrompt(request), 
    model: 'gpt-3.5-x', 
    temperature: 0.5
  });
  
  // 2. If doc attached: condense via Claude
  const condensed = request.doc 
    ? await claude.summarize({
        text: request.doc, 
        instructions: claudeSummPrompt
      }) 
    : null;
  
  // 3. Final gen (OpenAI gpt-4-like)
  const final = await openai.generate({
    prompt: finalPrompt(request, condensed), 
    model: 'gpt-4-x', 
    temperature: 0.15
  });
  
  // 4. Safety check (Claude)
  const audit = await claude.audit({
    text: final, 
    instructions: safetyPrompt
  });
  
  if (!audit.safe) { 
    return {
      status: 'manual_review', 
      issues: audit.issues
    }; 
  }
  
  // 5. Save & return
  await db.save({
    worksheet: final, 
    metadata: {
      models: ['openai', 'claude'], 
      timestamps: Date.now()
    }
  });
  
  return {
    status: 'ok', 
    worksheet: JSON.parse(final)
  };
}
```

## 13) Example Ready-to-Use Prompt Snippets (Copy/Paste)

### OpenAI System (Strict)
```
You are an expert K-5 teacher and JSON generator. Return ONLY valid JSON in the schema below. Do not return any other text. If you cannot answer or need clarification, return a JSON object {error: 'clarify', message: '...'} rather than free text. Schema: [paste schema].
```

### Claude System (Summarizer & Auditor)
```
You are a conservative summarizer and pedagogy auditor. Be concise and do not invent facts. Return only JSON, with fields: sections[], metadata[], and audit[]. Mark unknown facts as 'not stated' rather than inventing them.
```

### Gemini System (Vision + Citations)
```
You are a visual analysis assistant. Use the supplied image + OCR text. Return ONLY JSON: elements, suggestions, caveats, citations. If asserting facts based on visible text or image content, include boundingBox and confidence.
```

## 14) Common Pitfalls and Mitigations

- **Hallucinated distractors**: Require distractors to be tied to explicit "common mistakes" rules and ask for short rationale for each distractor.
- **Invalid JSON**: Include a retry pass and a deterministic fallback; store promptVersion to allow debugging.
- **Model drift (style changes across API)**: Include a "style example" in prompts (1–2 examples) and use metadata to track modelUsed & prompt hash.
- **Visual hallucination**: Combine OCR + model; do not trust pure visual model output without OCR/text corroboration for text-heavy diagrams.

## 15) Next Steps

- ✅ Created AI_BLUEPRINT.md with this content
- 🔄 Consider implementing:
  - Enhanced prompt templates following these guidelines
  - JSON schema validation with retry logic
  - Safety/audit pipeline using Claude
  - Orchestration patterns for multi-step generation
  - Benchmarking scripts to compare providers

