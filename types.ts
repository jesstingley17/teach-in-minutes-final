
export enum BloomLevel {
  RECALL = 'Recall',
  APPLICATION = 'Application',
  EVALUATION = 'Evaluation',
  CREATION = 'Creation'
}

export enum Differentiation {
  GENERAL = 'General',
  ADHD = 'ADHD-Friendly',
  GIFTED = 'Gifted/Advanced',
  ESL = 'ESL/ELL'
}

export enum AestheticStyle {
  CLASSIC = 'Classic Handwriting',
  CREATIVE = 'Creative Script',
  MODERN = 'Modern Professional',
  ACADEMIC = 'Academic Serifs'
}

export enum OutputType {
  HOMEWORK = 'Homework',
  QUIZ = 'Formative Quiz',
  EXAM = 'Summative Exam',
  GUIDED_NOTES = 'Guided Notes'
}

export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  suggestedDuration: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  type: 'text' | 'question' | 'instruction' | 'diagram_placeholder' | 'matching';
  content: string;
  points?: number;
  options?: string[]; // for MCQ
}

export interface InstructionalSuite {
  id: string;
  nodeId: string;
  title: string;
  institutionName: string;
  instructorName: string;
  outputType: OutputType;
  bloomLevel: BloomLevel;
  differentiation: Differentiation;
  aesthetic: AestheticStyle;
  sections: DocumentSection[];
  doodlePrompt?: string;
  doodleBase64?: string;
}

export interface BrandingConfig {
  institution: string;
  instructor: string;
  logoUrl?: string;
  signatureUrl?: string;
}
