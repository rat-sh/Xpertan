import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { User, Mode } from '../../types';
import { supabase } from '../../config/supabase';

interface StudentDashboardProps {
  user: User;
  onNavigate: (mode: Mode) => void;
  onLogout: () => void;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  score: number;
  total_marks: number;
  completed_at: string;
  exam_title?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onNavigate,
  onLogout,
}) => {
  const [examsTaken, setExamsTaken] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentStats = async () => {
      try {
        setLoading(true);

        // Fetch all exam attempts for this student
        const { data: attempts, error } = await supabase
          .from('exam_attempts')
          .select('id, exam_id, score, total_marks, completed_at')
          .eq('student_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) throw error;

        if (attempts && attempts.length > 0) {
          const totalExams = attempts.length;
          const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
          const average = totalScore / totalExams;

          setExamsTaken(totalExams);
          setAvgScore(average);

          // Get exam titles separately
          const examIds = [...new Set(attempts.map(a => a.exam_id))];
          const { data: exams } = await supabase
            .from('exams')
            .select('id, title')
            .in('id', examIds);

          // Format recent attempts (top 3) with exam titles
          const formatted = attempts.slice(0, 3).map((attempt) => ({
            id: attempt.id,
            exam_id: attempt.exam_id,
            score: attempt.score,
            total_marks: attempt.total_marks,
            completed_at: attempt.completed_at,
            exam_title: exams?.find(e => e.id === attempt.exam_id)?.title || 'Untitled Exam',
          }));

          setRecentAttempts(formatted);
        } else {
          setExamsTaken(0);
          setAvgScore(0);
          setRecentAttempts([]);
        }
      } catch (error) {
        console.error('Error loading student stats:', error);
        Alert.alert('Error', 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStudentStats();
  }, [user.id]);

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user.name}! 👋</Text>
          <Text style={styles.role}>Student Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.blueCard]}>
            <Text style={styles.statNumber}>{examsTaken}</Text>
            <Text style={styles.statLabel}>Exams Taken</Text>
          </View>
          <View style={[styles.statCard, styles.greenCard]}>
            <Text style={styles.statNumber}>
              {avgScore > 0 ? `${avgScore.toFixed(1)}%` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => onNavigate('answerSetup')}
          >
            <View style={[styles.actionIcon, styles.blueCard]}>
              <Text style={styles.actionIconText}>📝</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Take New Exam</Text>
              <Text style={styles.actionDescription}>
                Enter exam key and start your test
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              Alert.alert('Coming Soon', 'Practice Mode coming soon!');
            }}
          >
            <View style={[styles.actionIcon, styles.yellowCard]}>
              <Text style={styles.actionIconText}>🎯</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Practice Mode</Text>
              <Text style={styles.actionDescription}>
                Improve your skills with practice tests
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              Alert.alert('Coming Soon', 'Performance Analytics coming soon!');
            }}
          >
            <View style={[styles.actionIcon, styles.greenCard]}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Analytics</Text>
              <Text style={styles.actionDescription}>
                Track your performance and progress
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Attempts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attempts</Text>

          {recentAttempts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No exam attempts yet</Text>
              <Text style={styles.emptySubtext}>
                Take your first exam to see results here
              </Text>
            </View>
          ) : (
            recentAttempts.map((attempt) => {
              const grade = getGrade(attempt.score);
              const gradeBackground = attempt.score >= 70 ? styles.gradeHigh : styles.gradeLow;
              const gradeTextColor = attempt.score >= 70 ? styles.gradeTextHigh : styles.gradeTextLow;

              return (
                <View key={attempt.id} style={styles.attemptCard}>
                  <View style={styles.attemptHeader}>
                    <Text style={styles.attemptTitle}>{attempt.exam_title}</Text>
                    <View style={[styles.gradeBadge, gradeBackground]}>
                      <Text style={[styles.gradeText, gradeTextColor]}>{grade}</Text>
                    </View>
                  </View>
                  <View style={styles.attemptDetails}>
                    <Text style={styles.attemptScore}>Score: {attempt.score.toFixed(1)}%</Text>
                    <Text style={styles.attemptDate}>
                      📅 {new Date(attempt.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Learning Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Learning Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Practice regularly to improve your performance
            </Text>
            <Text style={styles.tipText}>
              • Review your mistakes after each exam
            </Text>
            <Text style={styles.tipText}>
              • Focus on weak areas identified by AI
            </Text>
            <Text style={styles.tipText}>
              • Manage your time effectively during exams
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  yellowCard: {
    backgroundColor: '#fef3c7',
  },
  greenCard: {
    backgroundColor: '#d1fae5',
  },
  blueCard: {
    backgroundColor: '#dbeafe',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  role: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  attemptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  attemptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  attemptScore: {
    fontSize: 14,
    color: '#374151',
  },
  attemptDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  tipCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  gradeHigh: {
    backgroundColor: '#d1fae5',
  },
  gradeLow: {
    backgroundColor: '#fef3c7',
  },
  gradeTextHigh: {
    color: '#059669',
  },
  gradeTextLow: {
    color: '#d97706',
  },
});