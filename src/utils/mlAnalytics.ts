import { CategoryScores, Question, Answers } from '../types';

export interface DetailedInsights {
  theoretical: number; // Score in theoretical questions
  mathematical: number; // Score in mathematical problems
  logical: number; // Score in logical reasoning
  problemSolving: number; // Score in problem-solving
}

export interface MLInsights {
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  difficultyPattern: 'improving' | 'declining' | 'stable';
  speedAnalysis: string;
  predictedScore: number;
  detailedInsights: DetailedInsights;
  studyMaterials: string[];
  skillAnalysis: {
    skill: string;
    score: number;
    status: 'excellent' | 'good' | 'needsImprovement';
  }[];
}

/**
 * Analyze question content to determine skill type
 */
type SkillType = 'theoretical' | 'mathematical' | 'logical' | 'problemSolving' | 'general';

const analyzeQuestionSkill = (question: Question): SkillType => {
  const questionLower = question.question.toLowerCase();
  
  // Theoretical keywords
  if (
    questionLower.includes('define') ||
    questionLower.includes('what is') ||
    questionLower.includes('explain') ||
    questionLower.includes('theory') ||
    questionLower.includes('concept')
  ) {
    return 'theoretical';
  }
  
  // Mathematical keywords
  if (
    questionLower.includes('calculate') ||
    questionLower.includes('find the value') ||
    questionLower.includes('solve') ||
    /\d+/.test(questionLower) || // Contains numbers
    questionLower.includes('equation') ||
    questionLower.includes('formula')
  ) {
    return 'mathematical';
  }
  
  // Logical reasoning
  if (
    questionLower.includes('if') ||
    questionLower.includes('then') ||
    questionLower.includes('pattern') ||
    questionLower.includes('sequence') ||
    questionLower.includes('reasoning') ||
    questionLower.includes('conclude')
  ) {
    return 'logical';
  }
  
  // Problem solving (application-based)
  if (
    questionLower.includes('apply') ||
    questionLower.includes('use') ||
    questionLower.includes('scenario') ||
    questionLower.includes('situation') ||
    questionLower.includes('problem')
  ) {
    return 'problemSolving';
  }
  
  return 'general';
};

/**
 * Calculate detailed skill-wise performance
 */
const calculateDetailedInsights = (
  questions: Question[],
  answers: Answers
): DetailedInsights => {
  const skillScores = {
    theoretical: { correct: 0, total: 0 },
    mathematical: { correct: 0, total: 0 },
    logical: { correct: 0, total: 0 },
    problemSolving: { correct: 0, total: 0 },
  };

  questions.forEach((q) => {
    const skill = analyzeQuestionSkill(q);
    if (skill === 'general') return;

    const userAnswer = answers[q.id];
    if (userAnswer === undefined) return;

    skillScores[skill].total++;

    // Check if correct
    let isCorrect = false;
    if (Array.isArray(q.correct)) {
      const userAns = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      isCorrect =
        userAns.length === q.correct.length &&
        userAns.every((ans) => Array.isArray(q.correct) && q.correct.includes(ans));
    } else {
      isCorrect = userAnswer === q.correct;
    }

    if (isCorrect) {
      skillScores[skill].correct++;
    }
  });

  return {
    theoretical:
      skillScores.theoretical.total > 0
        ? (skillScores.theoretical.correct / skillScores.theoretical.total) * 100
        : 0,
    mathematical:
      skillScores.mathematical.total > 0
        ? (skillScores.mathematical.correct / skillScores.mathematical.total) * 100
        : 0,
    logical:
      skillScores.logical.total > 0
        ? (skillScores.logical.correct / skillScores.logical.total) * 100
        : 0,
    problemSolving:
      skillScores.problemSolving.total > 0
        ? (skillScores.problemSolving.correct / skillScores.problemSolving.total) * 100
        : 0,
  };
};

/**
 * Generate study material recommendations based on category
 */
const getStudyMaterials = (category: string): string[] => {
  const materials: { [key: string]: string[] } = {
    Physics: [
      'NCERT Physics Textbooks (Class 11-12)',
      'HC Verma - Concepts of Physics',
      'Khan Academy Physics Videos',
      'MIT OpenCourseWare - Physics',
      'Practice numerical problems daily',
    ],
    Mathematics: [
      'RD Sharma Mathematics',
      'NCERT Mathematics (Class 11-12)',
      'Khan Academy Math',
      'Brilliant.org - Problem Solving',
      'Practice 20 problems daily',
    ],
    'Logical Reasoning': [
      'RS Aggarwal - Logical Reasoning',
      'Arun Sharma - Logical Reasoning',
      'Solve puzzles on BrainTeaser apps',
      'Practice pattern recognition daily',
      'Lumosity brain training',
    ],
    'Verbal Ability': [
      'Wren & Martin English Grammar',
      'Word Power Made Easy - Norman Lewis',
      'Read newspapers daily',
      'Vocabulary.com practice',
      'GRE vocabulary lists',
    ],
    'Data Interpretation': [
      'Arun Sharma - Data Interpretation',
      'Practice charts and graphs',
      'Excel data analysis tutorials',
      'Economic Times - Data sections',
      'Kaggle data visualization',
    ],
  };

  return materials[category] || [
    'Search online tutorials for ' + category,
    'YouTube educational channels',
    'Practice previous year questions',
    'Join study groups',
    'Use mobile learning apps',
  ];
};

export const analyzePerformance = (
  categoryScores: CategoryScores,
  score: number,
  questionTimes: { [questionId: number]: number },
  questions: Question[],
  answers: Answers
): MLInsights => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const studyMaterials: string[] = [];

  // Analyze category performance
  Object.entries(categoryScores).forEach(([cat, data]) => {
    const catScore = (data.correct / data.total) * 100;
    if (catScore >= 70) {
      strengths.push(cat);
    } else if (catScore < 50) {
      weaknesses.push(cat);
      // Add study materials for weak areas
      const materials = getStudyMaterials(cat);
      studyMaterials.push(...materials.slice(0, 2)); // Top 2 per weak category
    }
  });

  // Calculate detailed insights
  const detailedInsights = calculateDetailedInsights(questions, answers);

  // Create skill analysis
  const skillAnalysis = [
    {
      skill: 'Theoretical Knowledge',
      score: Math.round(detailedInsights.theoretical),
      status:
        detailedInsights.theoretical >= 70
          ? 'excellent'
          : detailedInsights.theoretical >= 50
          ? 'good'
          : 'needsImprovement',
    },
    {
      skill: 'Mathematical Ability',
      score: Math.round(detailedInsights.mathematical),
      status:
        detailedInsights.mathematical >= 70
          ? 'excellent'
          : detailedInsights.mathematical >= 50
          ? 'good'
          : 'needsImprovement',
    },
    {
      skill: 'Logical Reasoning',
      score: Math.round(detailedInsights.logical),
      status:
        detailedInsights.logical >= 70
          ? 'excellent'
          : detailedInsights.logical >= 50
          ? 'good'
          : 'needsImprovement',
    },
    {
      skill: 'Problem Solving',
      score: Math.round(detailedInsights.problemSolving),
      status:
        detailedInsights.problemSolving >= 70
          ? 'excellent'
          : detailedInsights.problemSolving >= 50
          ? 'good'
          : 'needsImprovement',
    },
  ] as any;

  // Speed analysis
  const avgTimePerQuestion =
    Object.values(questionTimes).reduce((a, b) => a + b, 0) /
    Object.keys(questionTimes).length;
  let speedAnalysis = '';

  if (avgTimePerQuestion < 20) {
    speedAnalysis =
      'You answered very quickly. Consider spending more time analyzing each question to improve accuracy.';
  } else if (avgTimePerQuestion > 60) {
    speedAnalysis =
      'You took considerable time per question. Work on improving speed through timed practice sessions.';
  } else {
    speedAnalysis =
      'Good balance between speed and accuracy! Maintain this pace while practicing.';
  }

  // Difficulty pattern
  const difficultyPattern: 'improving' | 'declining' | 'stable' = 'stable';

  // Personalized recommendation with study materials
  let recommendation = '';
  if (score >= 80) {
    recommendation = `Excellent performance! You're excelling in ${strengths.join(', ')}. 
    Focus on maintaining consistency and attempting advanced-level questions.`;
  } else if (score >= 60) {
    recommendation = `Good job! Your strengths are in ${strengths.join(', ')}. 
    To improve further, focus on: ${weaknesses.join(', ')}. 
    ${speedAnalysis}`;
  } else {
    recommendation = `Keep practicing! Priority areas for improvement: ${weaknesses.join(', ')}. 
    Dedicate 60% of study time to these topics. 
    ${speedAnalysis}
    Recommended study materials are listed below.`;
  }

  // Predict future score based on current performance
  const predictedScore = Math.min(100, score + (score >= 60 ? 5 : 10));

  return {
    strengths,
    weaknesses,
    recommendation,
    difficultyPattern,
    speedAnalysis,
    predictedScore,
    detailedInsights,
    studyMaterials: [...new Set(studyMaterials)], // Remove duplicates
    skillAnalysis,
  };
};

export const generateStudyPlan = (insights: MLInsights): string[] => {
  const plan: string[] = [];

  // Priority focus areas
  if (insights.weaknesses.length > 0) {
    plan.push(
      `🎯 Priority Focus (60% time): ${insights.weaknesses.join(', ')}`
    );
  }

  // Skill-specific recommendations
  insights.skillAnalysis.forEach((skill) => {
    if (skill.status === 'needsImprovement') {
      plan.push(
        `📖 ${skill.skill}: Currently at ${skill.score}%. Practice daily to reach 70%+`
      );
    }
  });

  // Study materials
  if (insights.studyMaterials.length > 0) {
    plan.push(`📚 Recommended Resources:`);
    insights.studyMaterials.forEach((material) => {
      plan.push(`   • ${material}`);
    });
  }

  // Maintain strengths
  if (insights.strengths.length > 0) {
    plan.push(
      `✅ Maintain Excellence (20% time): ${insights.strengths.join(', ')}`
    );
  }

  // Speed recommendation
  plan.push(`⏱️ ${insights.speedAnalysis}`);

  // Practice recommendation
  plan.push(
    `🎯 Target Score: ${insights.predictedScore}% (achievable in next attempt)`
  );

  // Time management
  plan.push(
    `⏰ Study Schedule: 2 hours daily - 1.2 hrs weak areas, 30 mins practice, 30 mins revision`
  );

  return plan;
};