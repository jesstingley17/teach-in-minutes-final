import { CurriculumNode, InstructionalSuite, OutputType, BloomLevel, Differentiation, AestheticStyle, EducationalStandard, GradeLevel } from '../types';
import { generateSuite as generateSuiteUnified } from './aiService';
import { generateQuickPreview } from './previewService';
import { condenseCurriculum, summarizeNode } from './summarizationService';
import { auditSuite, isContentSafe } from './safetyAuditService';
import { generateDoodle } from './geminiService';

/**
 * Orchestration Service
 * Implements the Preview → Final → Audit pipeline as per AI_BLUEPRINT.md
 */

export interface GenerationOptions {
  enablePreview?: boolean;
  enableCondensation?: boolean;
  enableAudit?: boolean;
  enableVisuals?: boolean;
  preferredProvider?: any; // AIProvider
}

export interface GenerationResult {
  suite: InstructionalSuite;
  preview?: {
    title: string;
    overview: string;
    estimatedSections: number;
    sampleSections: Array<{ type: string; title: string; preview: string }>;
  };
  audit?: {
    safe: boolean;
    issues: Array<{ type: string; severity: string; reason: string }>;
    recommendations: Array<{ change: string; explanation: string }>;
  };
  metadata: {
    modelsUsed: string[];
    generationTimeSec: number;
    previewTimeSec?: number;
    auditTimeSec?: number;
  };
}

/**
 * Full orchestration pipeline: Preview → Condense → Generate → Audit
 */
export const generateWithOrchestration = async (
  node: CurriculumNode,
  outputType: OutputType,
  bloomLevel: BloomLevel,
  differentiation: Differentiation,
  aesthetic: AestheticStyle,
  branding: { institution: string, instructor: string },
  pageCount: number = 1,
  gradeLevel?: GradeLevel,
  standards?: EducationalStandard[],
  options: GenerationOptions = {},
  longDocumentText?: string
): Promise<GenerationResult> => {
  const startTime = Date.now();
  const modelsUsed: string[] = [];
  
  // Step 1: Quick Preview (optional, fast feedback)
  let preview;
  if (options.enablePreview) {
    try {
      const previewStart = Date.now();
      preview = await generateQuickPreview(node, outputType, bloomLevel, differentiation);
      modelsUsed.push('gpt-4o-mini (preview)');
      const previewTime = (Date.now() - previewStart) / 1000;
      console.log('Preview generated in', previewTime, 'seconds');
    } catch (error) {
      console.warn('Preview generation failed, continuing without preview:', error);
    }
  }
  
  // Step 2: Condense long document if provided (optional)
  let condensedContext: string | undefined;
  if (options.enableCondensation && longDocumentText) {
    try {
      const condensed = await condenseCurriculum(longDocumentText);
      modelsUsed.push('claude-3-5-sonnet (condensation)');
      condensedContext = condensed.sections.map(s => `${s.title}: ${s.summary}`).join('\n\n');
      console.log('Document condensed:', condensed.metadata.condensedLengthWords, 'words');
    } catch (error) {
      console.warn('Condensation failed, continuing without condensed context:', error);
    }
  }
  
  // Step 3: Generate final suite
  const generationStart = Date.now();
  const doodleData = options.enableVisuals 
    ? await generateDoodle(node, aesthetic).catch(() => undefined)
    : undefined;
  
  const suite = await generateSuiteUnified(
    node,
    outputType,
    bloomLevel,
    differentiation,
    aesthetic,
    branding,
    pageCount,
    gradeLevel,
    standards,
    options.preferredProvider,
    doodleData
  ) as any; // Type assertion needed due to metadata field
  
  modelsUsed.push(suite.metadata?.provider || 'unknown');
  const generationTime = (Date.now() - generationStart) / 1000;
  
  // Step 4: Safety/Pedagogy Audit (optional)
  let audit;
  if (options.enableAudit) {
    try {
      const auditStart = Date.now();
      audit = await auditSuite(suite, gradeLevel);
      modelsUsed.push('claude-3-5-sonnet (audit)');
      const auditTime = (Date.now() - auditStart) / 1000;
      console.log('Audit completed in', auditTime, 'seconds. Safe:', audit.safe);
      
      // Add audit results to metadata if unsafe
      if (!audit.safe && suite.metadata) {
        suite.metadata.auditIssues = audit.issues.length;
      }
    } catch (error) {
      console.warn('Audit failed, continuing without audit:', error);
    }
  }
  
  const totalTime = (Date.now() - startTime) / 1000;
  
  return {
    suite,
    preview,
    audit,
    metadata: {
      modelsUsed,
      generationTimeSec: totalTime,
      previewTimeSec: preview ? (Date.now() - startTime) / 1000 : undefined,
      auditTimeSec: audit ? (Date.now() - startTime) / 1000 : undefined
    }
  };
};

/**
 * Simplified generation (backwards compatible)
 * Just generates the suite without orchestration
 */
export const generateSimple = async (
  node: CurriculumNode,
  outputType: OutputType,
  bloomLevel: BloomLevel,
  differentiation: Differentiation,
  aesthetic: AestheticStyle,
  branding: { institution: string, instructor: string },
  pageCount: number = 1,
  gradeLevel?: GradeLevel,
  standards?: EducationalStandard[],
  preferredProvider?: any,
  doodleBase64?: string
): Promise<InstructionalSuite> => {
  const { suite } = await generateWithOrchestration(
    node,
    outputType,
    bloomLevel,
    differentiation,
    aesthetic,
    branding,
    pageCount,
    gradeLevel,
    standards,
    { enablePreview: false, enableAudit: false, enableVisuals: !!doodleBase64 },
    undefined
  );
  
  return suite;
};

