export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: string;
}

export interface Exam {
  title: string;
  questions: Question[];
  key: string;
  createdAt: string;
}

export interface Exams {
  [key: string]: Exam;
}

export interface Answers {
  [key: number]: number;
}

export interface CategoryScore {
  correct: number;
  total: number;
}

export interface CategoryScores {
  [key: string]: CategoryScore;
}

export type Mode = 'home' | 'create' | 'answer' | 'answerSetup';