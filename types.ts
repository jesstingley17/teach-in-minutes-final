
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
  NGSS = 'NGSS (Next Gen Science)',
  STATE_TEXAS = 'Texas TEKS',
  STATE_CALIFORNIA = 'California Standards',
  STATE_FLORIDA = 'Florida Standards',
  STATE_NEW_YORK = 'New York Standards',
  INTERNATIONAL_BAC = 'IB (International Baccalaureate)',
  AP = 'AP (Advanced Placement)',
  CUSTOM = 'Custom/Other'
}

export interface EducationalStandard {
  code: string; // e.g., "CCSS.MATH.CONTENT.3.OA.A.1"
  description: string; // Full text of the standard
  framework: StandardsFramework;
  subject?: string; // Math, ELA, Science, etc.
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
  gradeLevel?: GradeLevel;
  standardsFramework?: StandardsFramework;
  standards?: EducationalStandard[]; // Aligned educational standards
  showStandards?: boolean; // Whether to display standards on materials
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
