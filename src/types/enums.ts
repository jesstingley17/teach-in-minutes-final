/**
 * Enumerations for the application
 */

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

