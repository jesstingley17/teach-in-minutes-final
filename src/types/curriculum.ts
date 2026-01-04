/**
 * Curriculum-related types
 */

import { GradeLevel, StandardsFramework } from './enums';

export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  suggestedDuration: string;
}

export interface CurriculumGap {
  missingConcept: string;
  importance: 'low' | 'medium' | 'high';
  suggestedNode: string;
  reason: string;
}

export interface Prerequisite {
  concept: string;
  requiredFor: string[];
  masteryLevel: string;
  assessmentSuggestions: string[];
}

export interface LearningPath {
  recommendedOrder: string[];
  rationale: string;
  alternativePaths?: string[][];
}

export interface AssessmentRecommendation {
  nodeId: string;
  assessmentType: 'formative' | 'summative' | 'diagnostic' | 'self-assessment';
  timing: string;
  format: string[];
  rationale: string;
}

export interface DifferentiationSuggestion {
  nodeId: string;
  forADHD: string[];
  forGifted: string[];
  forESL: string[];
  forStruggling: string[];
}

export interface EducationalStandard {
  code: string;
  description: string;
  framework: StandardsFramework;
  subject?: string;
}

export interface CurriculumAnalysis {
  nodes: CurriculumNode[];
  gaps: CurriculumGap[];
  prerequisites: Prerequisite[];
  learningPath: LearningPath;
  assessmentRecommendations: AssessmentRecommendation[];
  differentiationSuggestions: DifferentiationSuggestion[];
  standardsAlignment: EducationalStandard[];
  estimatedTotalDuration: string;
  complexityAnalysis: {
    averageBloomLevel: string;
    difficultyProgression: 'gradual' | 'steep' | 'inconsistent';
    recommendations: string[];
  };
  readabilityAnalysis?: {
    averageLevel: string;
    needsAdjustment: string[];
  };
}

