import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { Exam, Answers, Mode } from '../types';
import { calculateResults } from '../utils/helpers';

interface ResultsScreenProps {
  exam: Exam;
  answers: Answers;
  onNavigate: (mode: Mode) => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ exam, answers, onNavigate }) => {
  const results = calculateResults(exam, answers);

  if (!results) return null;

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Your Results</Text>
          <Text style={styles.resultsScore}>{results.score.toFixed(1)}%</Text>
          <Text style={styles.resultsSubtitle}>
            {results.correct} out of {results.total} correct
          </Text>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Performance by Category</Text>
          {Object.entries(results.categoryScores).map(([cat, data]) => {
            const percentage = (data.correct / data.total) * 100;
            return (
              <View key={cat} style={styles.categoryResult}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{cat}</Text>
                  <Text style={styles.categoryScore}>{data.correct}/{data.total}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          
          {results.strengths.length > 0 && (
            <View style={[styles.insightBox, styles.strengthBox]}>
              <Text style={styles.insightTitle}>Strengths</Text>
              <Text style={styles.insightText}>
                You excel in: {results.strengths.join(', ')}
              </Text>
            </View>
          )}

          {results.weaknesses.length > 0 && (
            <View style={[styles.insightBox, styles.weaknessBox]}>
              <Text style={styles.insightTitle}>Areas to Improve</Text>
              <Text style={styles.insightText}>
                Practice more: {results.weaknesses.join(', ')}
              </Text>
            </View>
          )}

          <View style={[styles.insightBox, styles.recommendationBox]}>
            <Text style={styles.insightTitle}>Recommendation</Text>
            <Text style={styles.insightText}>
              {results.score >= 80 
                ? "Excellent! You're ready for advanced challenges."
                : results.score >= 60
                ? "Good job! Focus on weak areas to improve."
                : "Keep practicing! Consistent effort pays off."}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.primaryButton, styles.resultsButton]}
          onPress={() => onNavigate('home')}
        >
          <Text style={commonStyles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  resultsHeader: {
    backgroundColor: '#7c3aed',
    padding: 40,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  resultsScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#e9d5ff',
    marginTop: 8,
  },
  resultSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryResult: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  categoryScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  insightBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  strengthBox: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  weaknessBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  recommendationBox: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
  },
  resultsButton: {
    margin: 20,
  },
});

export default ResultsScreen;