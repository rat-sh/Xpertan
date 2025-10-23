/**
 * Transformer utilities for mapping between Supabase database types and app types
 * Ensures consistent data handling at boundaries
 */

import { Exam, ExamAttempt, User } from '../types';


export const transformExamFromDB = (dbExam: any): Exam => {
  // Parse questions if stored as JSON string
  let questions = dbExam.questions || [];
  if (typeof dbExam.questions === 'string') {
    try {
      questions = JSON.parse(dbExam.questions);
    } catch (e) {
      console.error('[TRANSFORMER] Error parsing questions:', e);
      questions = [];
    }
  }

  return {
    id: dbExam.id,
    title: dbExam.title || 'Untitled Exam',
    questions,
    key: dbExam.key,
    createdAt: dbExam.created_at,
    duration: dbExam.duration || 30,
    negativeMarking: dbExam.negative_marking || 0,
    positiveMarks: dbExam.positive_marks || 1,
    batchId: dbExam.batch_id || undefined,
    teacherId: dbExam.teacher_id,
  };
};
/**
 * Transform app Exam type to Supabase insert format
 */
export const transformExamToDB = (exam: Exam): any => {
  return {
    id: exam.id,  // for update purposes
    title: exam.title,
    questions: exam.questions,
    key: exam.key,
    created_at: exam.createdAt,
    duration: exam.duration,
    negative_marking: exam.negativeMarking,
    positive_marks: exam.positiveMarks,
    batch_id: exam.batchId,
    teacher_id: exam.teacherId,
  };
};

/**
 * Transform Supabase user row to app User type
 */
export const transformUserFromDB = (dbUser: any): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    role: dbUser.role,
    batchId: dbUser.batch_id,
    parentContact: dbUser.parent_contact,
  };
};

/**
 * Transform app User type to Supabase insert format
 */
export const transformUserToDB = (user: User): any => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    batch_id: user.batchId || null,
    parent_contact: user.parentContact || null,
  };
};

/**
 * Transform app ExamAttempt type to Supabase insert format
 */
export const transformExamAttemptToDB = (
  attempt: Partial<ExamAttempt> & {
    examKey?: string;
    studentId: string;
    answers: any;
    questionTimes: any;
    score: number;
    completedAt: string;
  },
  examId?: string,
  totalMarks?: number
): any => {
  const finalExamId = examId || attempt.examKey;
  
  if (!finalExamId) {
    console.error('[TRANSFORMER] CRITICAL: No exam ID provided to transformExamAttemptToDB');
    throw new Error('Exam ID is required for exam attempt');
  }

  console.log('[TRANSFORMER] Creating exam attempt for exam_id:', finalExamId);

  return {
    exam_id: finalExamId, 
    student_id: attempt.studentId,
    answers: attempt.answers,
    question_times: attempt.questionTimes,
    score: attempt.score,
    total_marks: totalMarks || 0,
    completed_at: attempt.completedAt,
  };
};

/**
 * Transform Supabase exam attempt row to app ExamAttempt type
 */

export const transformExamAttemptFromDB = (dbAttempt: any): ExamAttempt => {
  return {
    examKey: dbAttempt.exam_id || dbAttempt.exam_key, // Support both field names
    studentId: dbAttempt.student_id,
    answers: dbAttempt.answers,
    questionTimes: dbAttempt.question_times,
    score: dbAttempt.score,
    timeTaken: dbAttempt.time_taken,
    completedAt: dbAttempt.completed_at,
  };
};
