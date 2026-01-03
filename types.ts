
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
  WORKSHEET = 'Worksheet',
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
  correctAnswer?: string | number | string[]; // for auto-grading
  pageNumber?: number; // which page this section belongs to
  order?: number; // order within page
}

export interface Page {
  id: string;
  pageNumber: number;
  sections: DocumentSection[];
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
  pages?: Page[]; // Multi-page support
  pageCount?: number; // Number of pages (1-10)
  doodlePrompt?: string;
  doodleBase64?: string;
  folderId?: string; // Folder organization
  createdAt?: string;
  updatedAt?: string;
  isInteractive?: boolean; // Interactive mode flag
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string; // For nested folders
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InteractiveProgress {
  suiteId: string;
  userId?: string;
  answers: Record<string, string | number | string[]>; // sectionId -> answer
  score?: number;
  totalPoints?: number;
  completedAt?: string;
  startedAt?: string;
}

export interface BrandingConfig {
  institution: string;
  instructor: string;
  logoUrl?: string;
  signatureUrl?: string;
}
