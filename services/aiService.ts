import { AIProvider, CurriculumNode, InstructionalSuite, OutputType, BloomLevel, Differentiation, AestheticStyle, EducationalStandard, GradeLevel, StandardsFramework } from '../types';
import { analyzeCurriculum as analyzeCurriculumGemini, analyzeDocument as analyzeDocumentGemini, generateSuite as generateSuiteGemini } from './geminiService';
import { analyzeCurriculumOpenAI, analyzeDocumentOpenAI, generateSuiteOpenAI } from './openaiService';
import { analyzeCurriculumClaude, analyzeDocumentClaude, generateSuiteClaude } from './claudeService';

/**
 * Unified AI Service with multi-provider support and fallback logic
 */

/**
 * Get available providers based on configured API keys
 */
export const getAvailableProviders = (): AIProvider[] => {
  const providers: AIProvider[] = [];
  
  if (import.meta.env.GEMINI_API_KEY) {
    providers.push(AIProvider.GEMINI);
  }
  if (import.meta.env.OPENAI_API_KEY) {
    providers.push(AIProvider.OPENAI);
  }
  if (import.meta.env.ANTHROPIC_API_KEY) {
    providers.push(AIProvider.CLAUDE);
  }
  
  return providers;
};

/**
 * Get default provider (first available, with Gemini as preferred)
 */
export const getDefaultProvider = (): AIProvider => {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error('No AI providers configured. Please set at least one API key (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY).');
  }
  // Prefer Gemini, then OpenAI, then Claude
  return available.find(p => p === AIProvider.GEMINI) || 
         available.find(p => p === AIProvider.OPENAI) || 
         available[0];
};

/**
 * Analyze curriculum with provider selection and fallback
 */
export const analyzeCurriculum = async (
  rawText: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework,
  preferredProvider?: AIProvider
): Promise<CurriculumNode[]> => {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error('No AI providers configured.');
  }

  const providersToTry = preferredProvider && available.includes(preferredProvider)
    ? [preferredProvider, ...available.filter(p => p !== preferredProvider)]
    : available;

  let lastError: Error | null = null;

  for (const provider of providersToTry) {
    try {
      console.log(`Attempting curriculum analysis with ${provider}...`);
      
      switch (provider) {
        case AIProvider.GEMINI:
          return await analyzeCurriculumGemini(rawText, gradeLevel, standardsFramework);
        case AIProvider.OPENAI:
          return await analyzeCurriculumOpenAI(rawText, gradeLevel, standardsFramework);
        case AIProvider.CLAUDE:
          return await analyzeCurriculumClaude(rawText, gradeLevel, standardsFramework);
        default:
          continue;
      }
    } catch (error: any) {
      console.warn(`${provider} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Analyze document (PDF/image) with provider selection and fallback
 */
export const analyzeDocument = async (
  base64Data: string,
  mimeType: string,
  gradeLevel?: GradeLevel,
  standardsFramework?: StandardsFramework,
  preferredProvider?: AIProvider
): Promise<CurriculumNode[]> => {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error('No AI providers configured.');
  }

  const providersToTry = preferredProvider && available.includes(preferredProvider)
    ? [preferredProvider, ...available.filter(p => p !== preferredProvider)]
    : available;

  let lastError: Error | null = null;

  for (const provider of providersToTry) {
    try {
      console.log(`Attempting document analysis with ${provider}...`);
      
      switch (provider) {
        case AIProvider.GEMINI:
          return await analyzeDocumentGemini(base64Data, mimeType, gradeLevel, standardsFramework);
        case AIProvider.OPENAI:
          return await analyzeDocumentOpenAI(base64Data, mimeType, gradeLevel, standardsFramework);
        case AIProvider.CLAUDE:
          return await analyzeDocumentClaude(base64Data, mimeType, gradeLevel, standardsFramework);
        default:
          continue;
      }
    } catch (error: any) {
      console.warn(`${provider} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Generate instructional suite with provider selection and fallback
 */
export const generateSuite = async (
  node: CurriculumNode,
  outputType: OutputType,
  bloomLevel: BloomLevel,
  differentiation: Differentiation,
  aesthetic: AestheticStyle,
  branding: { institution: string, instructor: string },
  pageCount: number = 1,
  gradeLevel?: GradeLevel,
  standards?: EducationalStandard[],
  preferredProvider?: AIProvider,
  doodleBase64?: string
): Promise<InstructionalSuite> => {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error('No AI providers configured.');
  }

  const providersToTry = preferredProvider && available.includes(preferredProvider)
    ? [preferredProvider, ...available.filter(p => p !== preferredProvider)]
    : available;

  let lastError: Error | null = null;

  for (const provider of providersToTry) {
    try {
      console.log(`Attempting suite generation with ${provider}...`);
      
      switch (provider) {
        case AIProvider.GEMINI:
          return await generateSuiteGemini(node, outputType, bloomLevel, differentiation, aesthetic, branding, doodleBase64, pageCount, gradeLevel, standards);
        case AIProvider.OPENAI:
          return await generateSuiteOpenAI(node, outputType, bloomLevel, differentiation, aesthetic, branding, pageCount, gradeLevel, standards);
        case AIProvider.CLAUDE:
          return await generateSuiteClaude(node, outputType, bloomLevel, differentiation, aesthetic, branding, pageCount, gradeLevel, standards);
        default:
          continue;
      }
    } catch (error: any) {
      console.warn(`${provider} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
};





