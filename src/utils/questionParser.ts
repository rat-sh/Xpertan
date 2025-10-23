import { Question, QuestionType } from '../types';

export interface ParsedQuestion {
  question: string;
  options: string[];
  correct?: number;
  category?: string;
}

/**
 * Parse questions from text format
 * Supports multiple formats:
 * 
 * Format 1:
 * Q1. Question text?
 * a) Option 1
 * b) Option 2
 * c) Option 3
 * d) Option 4
 * Answer: a
 * Category: Logical Reasoning
 * 
 * Format 2:
 * 1. Question text?
 * A. Option 1
 * B. Option 2
 * C. Option 3
 * D. Option 4
 * Correct: A
 * 
 * Format 3 (simple):
 * Question text?
 * Option 1
 * Option 2
 * Option 3
 * Option 4
 * Answer: 1
 */
export const parseQuestionsFromText = (text: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  
  // Clean and normalize text
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // Split by question patterns
  const questionBlocks = normalizedText.split(/(?=^Q\d+\.|\n\d+\.)/gm).filter(Boolean);

  questionBlocks.forEach(block => {
    try {
      const parsed = parseQuestionBlock(block);
      if (parsed && parsed.question && parsed.options.length >= 2) {
        questions.push(parsed);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn('Failed to parse block:', block.substring(0, 50));
    }
  });

  return questions;
};

const parseQuestionBlock = (block: string): ParsedQuestion | null => {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 3) return null; // Need at least question + 2 options

  let question = '';
  const options: string[] = [];
  let correct: number | undefined;
  let category: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract question
    if (!question && (line.match(/^(Q\d+\.|\d+\.)/i) || i === 0)) {
      question = line
        .replace(/^(Q\d+\.|\d+\.)/i, '')
        .replace(/^Question:?/i, '')
        .trim();
      continue;
    }

    // Extract options (a), b), c), d) OR A., B., C., D. OR just lines
    if (line.match(/^[a-d]\)|\([a-d]\)|^[A-D]\.|^\d+\./i)) {
      const option = line
        .replace(/^[a-d]\)|\([a-d]\)|^[A-D]\.|^\d+\./i, '')
        .trim();
      if (option) options.push(option);
      continue;
    }

    // Extract answer
    if (line.match(/^(Answer|Correct|Ans):?/i)) {
      const answerMatch = line.match(/[a-d]|[A-D]|\d+/);
      if (answerMatch) {
        const ans = answerMatch[0].toLowerCase();
        if (ans >= 'a' && ans <= 'd') {
          correct = ans.charCodeAt(0) - 'a'.charCodeAt(0);
        } else if (!isNaN(parseInt(ans, 10))) {
          correct = parseInt(ans, 10) - 1;
        }
      }
      continue;
    }

    // Extract category
    if (line.match(/^Category:?/i)) {
      category = line.replace(/^Category:?/i, '').trim();
      continue;
    }

    // If no pattern matched and we have question but no options yet, might be an option
    if (question && options.length < 4 && !line.match(/^(Answer|Correct|Category)/i)) {
      options.push(line);
    }
  }

  if (!question || options.length < 2) return null;

  return { question, options, correct, category };
};

/**
 * ML-based question enhancement
 * Analyzes question and suggests:
 * - Question type (single/multiple/boolean)
 * - Category based on keywords
 * - Difficulty level
 */
export const enhanceQuestion = (parsed: ParsedQuestion): {
  type: QuestionType;
  suggestedCategory: string;
  difficulty: 'easy' | 'medium' | 'hard';
} => {
  const questionLower = parsed.question.toLowerCase();
  
  // Detect question type
  let type: QuestionType = 'single';
  if (parsed.options.length === 2 && 
      (questionLower.includes('true') || questionLower.includes('false'))) {
    type = 'boolean';
  } else if (questionLower.includes('all of') || 
             questionLower.includes('select all') ||
             questionLower.includes('which of the following')) {
    type = 'multiple';
  }

  // Suggest category based on keywords
  const categoryKeywords: { [key: string]: string[] } = {
    'Logical Reasoning': ['logic', 'sequence', 'pattern', 'series', 'analogy'],
    'Numerical Ability': ['number', 'calculate', 'percentage', 'ratio', 'profit'],
    'Verbal Reasoning': ['synonym', 'antonym', 'word', 'sentence', 'grammar'],
    'Data Interpretation': ['data', 'graph', 'table', 'chart', 'statistics'],
    'General Knowledge': ['capital', 'country', 'who', 'when', 'where', 'history'],
    'Technical': ['code', 'algorithm', 'program', 'computer', 'function'],
  };

  let suggestedCategory = parsed.category || 'General';
  let maxMatches = 0;

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const matches = keywords.filter(kw => questionLower.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      suggestedCategory = category;
    }
  });

  // Estimate difficulty
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  const questionLength = parsed.question.length;
  const avgOptionLength = parsed.options.reduce((sum, opt) => sum + opt.length, 0) / parsed.options.length;
  
  if (questionLength < 50 && avgOptionLength < 20) {
    difficulty = 'easy';
  } else if (questionLength > 150 || avgOptionLength > 50) {
    difficulty = 'hard';
  }

  return { type, suggestedCategory, difficulty };
};

/**
 * Convert parsed questions to Question objects
 */
export const convertToQuestions = (
  parsedQuestions: ParsedQuestion[],
  startId: number = 1
): Question[] => {
  return parsedQuestions.map((parsed, index) => {
    const enhanced = enhanceQuestion(parsed);
    
    return {
      id: startId + index,
      question: parsed.question,
      options: parsed.options,
      correct: parsed.correct ?? 0,
      category: enhanced.suggestedCategory,
      type: enhanced.type,
      marks: 1,
    };
  });
};