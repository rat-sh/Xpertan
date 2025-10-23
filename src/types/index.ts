
export type QuestionType = 'single' | 'multiple' | 'boolean';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number | number[]; // single: number, multiple: number[]
  category: string;
  type: QuestionType;
  timeSpent?: number;
  marks?: number; // positive marks
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
  key: string;
  createdAt: string;
  duration: number;
  negativeMarking: number; // e.g., 0.25 for -0.25 per wrong answer
  positiveMarks: number; // marks per correct answer
  batchId?: string;
  teacherId?: string;
}

export interface QuestionBank {
  id: string;
  title: string;
  questions: Question[];
  category: string;
  createdAt: string;
  createdBy: string;
}

export interface QuestionBanks {
  [id: string]: QuestionBank;
}

export interface Exams {
  [key: string]: Exam;
}

export interface Answers {
  [key: number]: number | number[]; 
}

export interface CategoryScore {
  correct: number;
  total: number;
  avgTimeSpent?: number;
}

export interface CategoryScores {
  [key: string]: CategoryScore;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher';
  batchId?: string;
  parentContact?: string;
}

export interface Batch {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
}

export interface ExamAttempt {
  examKey: string;
  studentId: string;
  answers: Answers;
  score: number;
  timeTaken: number;
  completedAt: string;
  questionTimes: { [questionId: number]: number };
}

export interface ExamResults {
  score: number;
  totalMarks: number;
  maxMarks: number;
  correct: number;
  wrong: number;
  unanswered: number;
  categoryScores: CategoryScores;
}

export type Mode = 'splash' | 'login' | 'signup' | 'create' | 'answer' | 'answerSetup' | 'dashboard'  | 'questionBank' | 'batchManagement';

export type UserRole = 'teacher' | 'student';
