# AI Strategy Blueprint for ReclaimEdU

**Overview**: This document defines the AI strategy for ReclaimEdU: which providers to use for which tasks, strict JSON schemas, orchestration patterns (preview → final → audit), prompt templates, and integration notes for TypeScript.

## Providers & Roles

### Primary Providers
- **OpenAI**: Final content generation, structured JSON output, embeddings if desired
- **Claude (Anthropic)**: Long-context summarization, pedagogy & safety audits
- **Gemini (Google)**: Multimodal vision tasks and search-grounded verification

### Additional Providers (Future)
- **Adobe Firefly**: High-quality educational images
- **ElevenLabs**: Text-to-speech for accessibility
- **Cohere**: Alternative embeddings provider
- **Google Vertex AI**: Document AI / OCR capabilities

## Core JSON Schema (Worksheet)

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
    "generationTimeSec": number,
    "provider": "string"
  }
}
```

## Generation Prompt Templates

### Step 1 — Generation Prompt (OpenAI)

**System**:
```
You are an expert K-5 teacher and a strict JSON formatter. Return ONLY valid JSON matching the schema above. Do NOT include any commentary, markdown, or extraneous keys. Keep explanations concise (<40 words each). Use US grade labels (K, 1, 2, 3…).
```

**User**:
```
Generate a 1-page Grade 3 worksheet on [TOPIC] with objectives, activities, and a 3-question assessment. Include teacherKey entries for all assessment items.

Required:
- Title and grade level
- 3 learning objectives
- Reading level appropriate for grade
- 1 warmup activity (3 minutes)
- 2 practice activities (multiple-choice with plausible distractors)
- 1 assessment (3 questions with correct answers)
- Complete teacherKey with explanations
```

**Temperature**: 0.2 for structured output, 0.4 for creative activities  
**Max Tokens**: 3000-4000 for multi-page content

## Orchestration Pipelines

### Pipeline: Preview → Final → Audit

1. **Quick Preview** (Cheap OpenAI model - GPT-3.5 or GPT-4o-mini)
   - Generate initial draft for immediate user feedback
   - Fast response time
   - Lower cost per request

2. **Condense Context** (Claude)
   - Summarize long documents or curriculum
   - Extract key concepts and learning objectives
   - Prepare context for final generation

3. **Final Generation** (OpenAI high-tier - GPT-4o)
   - High-quality, structured JSON output
   - Full schema compliance
   - Comprehensive content

4. **Pedagogy Audit** (Claude)
   - Safety and appropriateness check
   - Pedagogical quality review
   - Age-appropriateness validation
   - Bias detection

5. **Visual Analysis** (Gemini - if images present)
   - Diagram interpretation
   - Layout analysis
   - OCR and visual content extraction

## Implementation Status

### ✅ Implemented
- Multi-provider architecture (OpenAI, Claude, Gemini)
- Unified AI service with fallback logic
- Enhanced prompts with strict JSON requirements
- JSON validation with retry logic
- Safety audit pipeline (Claude)
- Metadata tracking

### 🔄 In Progress / Planned
- Quick preview pipeline (cheap model for fast feedback)
- Long-document condensation (Claude summarization)
- Enhanced orchestration (preview → final → audit flow)
- Visual analysis integration (Gemini for diagrams)
- Embeddings for saved drafts (RAG)

### 📋 Future Enhancements
- Adobe Firefly integration (educational images)
- ElevenLabs TTS (accessibility)
- Cohere embeddings (alternative)
- Google Vertex AI (Document AI/OCR)
- Benchmarking suite
- Cost optimization strategies

## Error Handling & Robustness

- **JSON Validation**: Automatic retry on parse failure
- **Fallback Logic**: Try next provider if one fails
- **Schema Validation**: Ensure all required fields present
- **Error Recovery**: Graceful degradation with partial content flags

## Security & Privacy

- Strip PII before sending to APIs
- Prefer server-side API calls (not client-side)
- Check provider data usage policies
- Consider enterprise contracts for sensitive data

## Best Practices

1. **Temperature Guidelines**:
   - 0-0.2: Factual, assessments, structured output
   - 0.2-0.4: Activities, practice problems
   - 0.4-0.6: Creative content, examples
   - 0.6-0.9: Exploratory, brainstorming

2. **Token Management**:
   - Set max_tokens appropriately (3000-4000 for full worksheets)
   - Chunk long documents before processing
   - Use summarization for context reduction

3. **Prompt Engineering**:
   - Always require "Return ONLY valid JSON"
   - Include schema in system prompt
   - Provide 1-2 few-shot examples when needed
   - Be explicit about required fields

4. **Quality Assurance**:
   - Run safety audit on all generated content
   - Validate JSON schema before saving
   - Log metadata for debugging and improvement
   - Track parse success rates

## Integration Notes

### TypeScript Example (Simplified Pipeline)

```typescript
async function generateWorksheet(request) {
  // 1. Quick draft (optional - for fast preview)
  const draft = request.quickPreview 
    ? await openai.generate({ model: 'gpt-4o-mini', ... })
    : null;
  
  // 2. Condense context if long document
  const condensed = request.doc 
    ? await claude.summarize({ text: request.doc })
    : null;
  
  // 3. Final generation
  const final = await openai.generate({
    model: 'gpt-4o',
    prompt: buildPrompt(request, condensed),
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });
  
  // 4. Safety audit
  const audit = await claude.audit({ content: final });
  if (!audit.safe) {
    return { status: 'needs_review', issues: audit.issues };
  }
  
  // 5. Save with metadata
  await saveWorksheet({
    ...final,
    metadata: {
      modelUsed: 'gpt-4o',
      provider: 'OpenAI',
      generationTimeSec: elapsed,
      auditPassed: audit.safe
    }
  });
  
  return { status: 'ok', worksheet: final };
}
```

## Next Steps

1. ✅ Multi-provider architecture implemented
2. ✅ Enhanced prompts and validation
3. ✅ Safety audit pipeline
4. 🔄 Implement quick preview pipeline
5. 📋 Add long-document condensation
6. 📋 Enhance visual analysis
7. 📋 Benchmarking suite
8. 📋 Cost optimization monitoring
