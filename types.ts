
export enum BloomLevel {
  RECALL = 'Basic - Recall facts, define terms, identify concepts',
  APPLICATION = 'Intermediate - Solve problems, apply knowledge, use concepts',
  EVALUATION = 'Advanced - Judge quality, compare ideas, critique arguments',
  CREATION = 'Expert - Design solutions, create projects, build new work'
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

export enum GradeLevel {
  K = 'Kindergarten',
  GRADE_1 = '1st Grade',
  GRADE_2 = '2nd Grade',
  GRADE_3 = '3rd Grade',
  GRADE_4 = '4th Grade',
  GRADE_5 = '5th Grade',
  GRADE_6 = '6th Grade',
  GRADE_7 = '7th Grade',
  GRADE_8 = '8th Grade',
  GRADE_9 = '9th Grade',
  GRADE_10 = '10th Grade',
  GRADE_11 = '11th Grade',
  GRADE_12 = '12th Grade',
  UNIVERSITY = 'University'
}

export enum StandardsFramework {
  COMMON_CORE_MATH = 'Common Core Math',
  COMMON_CORE_ELA = 'Common Core ELA',
  NEXT_GEN_SCIENCE = 'Next Generation Science Standards',
  TEKS = 'Texas Essential Knowledge and Skills',
  FLORIDA_BEST = 'Florida B.E.S.T. Standards',
  OTHER = 'Other/General'
}

export enum AIProvider {
  GEMINI = 'Google Gemini',
  OPENAI = 'OpenAI',
  CLAUDE = 'Anthropic Claude'
}

export interface BrandingConfig {
  institution?: string;
  instructor?: string;
}

export interface EducationalStandard {
  code: string;
  description: string;
  framework: StandardsFramework;
  subject?: string;
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
  options?: string[];
  correctAnswer?: string | number | string[];
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
  provider?: AIProvider;
}
