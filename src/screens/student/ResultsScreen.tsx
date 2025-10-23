import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { Exam, Answers, Mode } from '../../types';
import { calculateResults } from '../../utils/helpers';
import { analyzePerformance, generateStudyPlan } from '../../utils/mlAnalytics';
import PerformanceChart from '../../components/PerformanceChart';

interface ResultsScreenProps {
  exam: Exam;
  answers: Answers;
  questionTimes: { [key: number]: number };
  onNavigate: (mode: Mode) => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  exam, 
  answers, 
  questionTimes,
  onNavigate 
}) => {
  const results = calculateResults(exam, answers);

  if (!results) return null;

  // AI/ML Analysis
  const mlInsights = analyzePerformance(
    results.categoryScores,
    results.score,
    questionTimes,
    exam.questions,
    answers
  );

  const studyPlan = generateStudyPlan(mlInsights);

  // Calculate time taken
  const totalTimeTaken = Object.values(questionTimes).reduce((sum, time) => sum + time, 0);
  const avgTimePerQuestion = totalTimeTaken / exam.questions.length;

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get grade based on score
  const getGrade = (score: number): { grade: string; color: string } => {
    if (score >= 90) return { grade: 'A+', color: '#10b981' };
    if (score >= 80) return { grade: 'A', color: '#34d399' };
    if (score >= 70) return { grade: 'B+', color: '#60a5fa' };
    if (score >= 60) return { grade: 'B', color: '#3b82f6' };
    if (score >= 50) return { grade: 'C', color: '#f59e0b' };
    if (score >= 40) return { grade: 'D', color: '#f97316' };
    return { grade: 'F', color: '#ef4444' };
  };

  const gradeInfo = getGrade(results.score);

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>🎉 Your Results</Text>
          
          {/* Grade Circle */}
          <View style={[styles.gradeCircle, { borderColor: gradeInfo.color }]}>
            <Text style={[styles.gradeText, { color: gradeInfo.color }]}>
              {gradeInfo.grade}
            </Text>
          </View>

          {/* Marks Display */}
          <View style={styles.marksContainer}>
            <Text style={styles.marksLabel}>Marks Obtained</Text>
            <Text style={styles.marksScore}>
              {results.totalMarks.toFixed(2)} / {results.maxMarks}
            </Text>
          </View>

          {/* Percentage */}
          <Text style={styles.resultsScore}>{results.score.toFixed(1)}%</Text>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{results.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>❌</Text>
              <Text style={styles.statNumber}>{results.wrong}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭕</Text>
              <Text style={styles.statNumber}>{results.unanswered}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
          </View>

          {/* Time Stats */}
          <View style={styles.timeStats}>
            <View style={styles.timeStat}>
              <Text style={styles.timeLabel}>Total Time</Text>
              <Text style={styles.timeValue}>{formatTime(totalTimeTaken)}</Text>
            </View>
            <View style={styles.timeStat}>
              <Text style={styles.timeLabel}>Avg/Question</Text>
              <Text style={styles.timeValue}>{formatTime(Math.floor(avgTimePerQuestion))}</Text>
            </View>
          </View>

          {/* Negative Marking Info */}
          {exam.negativeMarking > 0 && results.wrong > 0 && (
            <View style={styles.negativeMarkingInfo}>
              <Text style={styles.negativeMarkingText}>
                ⚠️ Penalty: -{(results.wrong * exam.negativeMarking).toFixed(2)} marks
              </Text>
            </View>
          )}
        </View>

        {/* Performance Graph */}
        <PerformanceChart categoryScores={results.categoryScores} />

        {/* AI Insights */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>🤖 AI-Powered Insights</Text>
          
          {mlInsights.strengths.length > 0 && (
            <View style={[styles.insightBox, styles.strengthBox]}>
              <Text style={styles.insightTitle}>💪 Your Strengths</Text>
              <Text style={styles.insightText}>
                Excellent performance in: {mlInsights.strengths.join(', ')}
              </Text>
            </View>
          )}

          {mlInsights.weaknesses.length > 0 && (
            <View style={[styles.insightBox, styles.weaknessBox]}>
              <Text style={styles.insightTitle}>📈 Areas to Improve</Text>
              <Text style={styles.insightText}>
                Focus more on: {mlInsights.weaknesses.join(', ')}
              </Text>
            </View>
          )}

          <View style={[styles.insightBox, styles.recommendationBox]}>
            <Text style={styles.insightTitle}>💡 Personalized Recommendation</Text>
            <Text style={styles.insightText}>{mlInsights.recommendation}</Text>
          </View>

          <View style={[styles.insightBox, styles.speedBox]}>
            <Text style={styles.insightTitle}>⏱️ Speed Analysis</Text>
            <Text style={styles.insightText}>{mlInsights.speedAnalysis}</Text>
          </View>

          <View style={[styles.insightBox, styles.predictionBox]}>
            <Text style={styles.insightTitle}>🎯 Predicted Next Score</Text>
            <View style={styles.predictionContent}>
              <Text style={styles.predictionScore}>{mlInsights.predictedScore}%</Text>
              <View style={styles.predictionArrow}>
                <Text style={styles.predictionArrowText}>
                  {mlInsights.predictedScore > results.score ? '📈 +' : '📊 '}
                  {Math.abs(mlInsights.predictedScore - results.score).toFixed(1)}%
                </Text>
              </View>
            </View>
            <Text style={styles.insightText}>
              Based on your performance pattern and improvement trend
            </Text>
          </View>
        </View>

        {/* Study Plan */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Personalized Study Plan</Text>
          <Text style={styles.studyPlanSubtitle}>
            Follow this plan to improve your next attempt
          </Text>
          
          {studyPlan.map((item, index) => (
            <View key={index} style={styles.studyPlanItem}>
              <View style={styles.studyPlanNumber}>
                <Text style={styles.studyPlanNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.studyPlanText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Detailed Question Analysis */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Question-wise Analysis</Text>
          
          {exam.questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const isCorrect = Array.isArray(q.correct)
              ? Array.isArray(userAnswer) && 
                userAnswer.length === q.correct.length &&
                userAnswer.every(ans => Array.isArray(q.correct) && q.correct.includes(ans))
              : userAnswer === q.correct;
            
            const timeTaken = questionTimes[q.id] || 0;

            return (
              <View key={idx} style={styles.questionAnalysis}>
                <View style={styles.questionAnalysisHeader}>
                  <Text style={styles.questionAnalysisNumber}>Q{idx + 1}</Text>
                  {userAnswer === undefined ? (
                    <View style={styles.skippedBadge}>
                      <Text style={styles.skippedBadgeText}>Skipped</Text>
                    </View>
                  ) : isCorrect ? (
                    <View style={styles.correctBadge}>
                      <Text style={styles.correctBadgeText}>✓ Correct</Text>
                    </View>
                  ) : (
                    <View style={styles.wrongBadge}>
                      <Text style={styles.wrongBadgeText}>✗ Wrong</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.questionAnalysisCategory}>{q.category}</Text>
                <Text style={styles.questionAnalysisTime}>
                  Time: {formatTime(timeTaken)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Back Button */}
        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.primaryButton, styles.resultsButton]}
          onPress={() => onNavigate('dashboard')}
        >
          <Text style={commonStyles.buttonText}>🏠 Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity 
          style={[commonStyles.button, styles.shareButton]}
          onPress={() => {
            Alert.alert('Coming Soon', 'Share feature coming soon!');
          }}
        >
          <Text style={styles.shareButtonText}>📤 Share Results</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottomSpacing: {
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  resultsHeader: {
    backgroundColor: '#7c3aed',
    padding: 40,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  gradeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gradeText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  marksContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  marksLabel: {
    fontSize: 14,
    color: '#e9d5ff',
    marginBottom: 4,
  },
  marksScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#e9d5ff',
    marginTop: 2,
  },
  timeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  timeStat: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#e9d5ff',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  negativeMarkingInfo: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
  },
  negativeMarkingText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  resultSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  studyPlanSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  insightBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  strengthBox: {
    backgroundColor: '#d1fae5',
    borderWidth: 2,
    borderColor: '#6ee7b7',
  },
  weaknessBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#fcd34d',
  },
  recommendationBox: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  speedBox: {
    backgroundColor: '#e0e7ff',
    borderWidth: 2,
    borderColor: '#a5b4fc',
  },
  predictionBox: {
    backgroundColor: '#fce7f3',
    borderWidth: 2,
    borderColor: '#f9a8d4',
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  predictionContent: {
    alignItems: 'center',
    marginVertical: 12,
  },
  predictionScore: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  predictionArrow: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
  },
  predictionArrowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  studyPlanItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
    alignItems: 'center',
  },
  studyPlanNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studyPlanNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  studyPlanText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  questionAnalysis: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d1d5db',
  },
  questionAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionAnalysisNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  correctBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  correctBadgeText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 12,
  },
  wrongBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  wrongBadgeText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  skippedBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  skippedBadgeText: {
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: 12,
  },
  questionAnalysisCategory: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    marginBottom: 4,
  },
  questionAnalysisTime: {
    fontSize: 11,
    color: '#6b7280',
  },
  resultsButton: {
    margin: 20,
  },
  shareButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  shareButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsScreen;
