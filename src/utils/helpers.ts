import { CategoryScores, Answers, Exam } from '../types';

export const generateKey = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const calculateResults = (
  currentExam: Exam,
  answers: Answers
) => {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let totalMarks = 0;
  const categoryScores: CategoryScores = {};

  currentExam.questions.forEach(q => {
    if (!categoryScores[q.category]) {
      categoryScores[q.category] = { correct: 0, total: 0 };
    }
    categoryScores[q.category].total++;

    // Check if answered
    if (answers[q.id] === undefined) {
      unanswered++;
      return;
    }

    // Check if correct
    let isCorrect = false;
    
    if (q.type === 'multiple') {
      // Multiple choice - compare arrays
      const userAnswer = (Array.isArray(answers[q.id]) ? answers[q.id] : [answers[q.id]]) as number[];
const correctAnswer = (Array.isArray(q.correct) ? q.correct : [q.correct]) as number[];
      
      isCorrect = userAnswer.length === correctAnswer.length &&
                  userAnswer.every(ans => correctAnswer.includes(ans));
    } else {
      // Single choice or boolean
      isCorrect = answers[q.id] === q.correct;
    }

    if (isCorrect) {
      correct++;
      categoryScores[q.category].correct++;
      totalMarks += q.marks || currentExam.positiveMarks;
    } else {
      wrong++;
      totalMarks -= currentExam.negativeMarking;
    }
  });

  const score = (correct / currentExam.questions.length) * 100;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  Object.entries(categoryScores).forEach(([cat, data]) => {
    const catScore = (data.correct / data.total) * 100;
    if (catScore >= 70) strengths.push(cat);
    else if (catScore < 50) weaknesses.push(cat);
  });

  return { 
    score, 
    correct,
    wrong,
    unanswered,
    totalMarks,
    maxMarks: currentExam.questions.length * (currentExam.positiveMarks || 1),
    total: currentExam.questions.length, 
    categoryScores, 
    strengths, 
    weaknesses 
  };
};