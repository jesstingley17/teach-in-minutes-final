/**
 * Instructional suite and material types
 */

import { OutputType, BloomLevel, Differentiation, AestheticStyle } from './enums';
import { EducationalStandard } from './curriculum';

export interface DocumentSection {
  id: string;
  title: string;
  type: 'text' | 'question' | 'instruction' | 'diagram_placeholder' | 'matching';
  content: string;
  points?: number;
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
  imageUrl?: string;
  imageBase64?: string;
  pageNumber?: number;
  order?: number;
}

export interface Page {
  id: string;
  pageNumber: number;
  sections: DocumentSection[];
}

export interface RubricCriterion {
  criterion: string;
  excellent: string;
  good: string;
  satisfactory: string;
  needsImprovement: string;
  points: number;
}

export interface Rubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  scale: string;
}

export interface TeacherKeyEntry {
  sectionId: string;
  sectionTitle: string;
  answer: string | number | string[];
  explanation?: string;
}

export interface InstructionalSuite {
  id: string;
  title: string;
  outputType: OutputType;
  bloomLevel: BloomLevel;
  differentiation: Differentiation;
  aesthetic: AestheticStyle;
  institutionName?: string;
  instructorName?: string;
  sections: DocumentSection[];
  pages?: Page[];
  pageCount?: number;
  standards?: EducationalStandard[];
  rubric?: Rubric;
  teacherKey?: TeacherKeyEntry[];
  doodleBase64?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InspirationAnalysis {
  layout?: {
    structure: string;
    spacing: string;
    organization: string;
  };
  design?: {
    colors: string;
    typography: string;
    visualElements: string;
  };
  recommendations: string;
}

export interface InspirationConfig {
  enabled: boolean;
  copyLayout: boolean;
  copyDesign: boolean;
  file: File | null;
}

export interface GenerationConfig {
  outputType: OutputType;
  bloomLevel: BloomLevel;
  differentiation: Differentiation;
  aesthetic: AestheticStyle;
  pageCount: number;
  includeVisuals: boolean;
  visualType: 'doodles' | 'diagrams' | 'both';
  provider?: import('./enums').AIProvider;
}

