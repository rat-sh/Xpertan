import { CategoryScores, Answers, Exam } from '../types';

export const generateKey = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const calculateResults = (
  currentExam: Exam,
  answers: Answers
) => {
  let correct = 0;
  const categoryScores: CategoryScores = {};

  currentExam.questions.forEach(q => {
    if (!categoryScores[q.category]) {
      categoryScores[q.category] = { correct: 0, total: 0 };
    }
    categoryScores[q.category].total++;

    if (answers[q.id] === q.correct) {
      correct++;
      categoryScores[q.category].correct++;
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
    total: currentExam.questions.length, 
    categoryScores, 
    strengths, 
    weaknesses 
  };
};