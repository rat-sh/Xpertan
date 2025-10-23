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

interface TeacherDashboardProps {
  user: User;
  onNavigate: (mode: Mode) => void;
  onLogout: () => void;
}

interface ExamData {
  key: string;
  title: string;
  questions: any[];
  duration: number;
  created_at: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onNavigate,
  onLogout,
}) => {
  const [examCount, setExamCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [recentExams, setRecentExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const loadTeacherStats = async () => {
    try {
      setLoading(true);

      // Fetch all exams created by this teacher
      const { data: exams, error } = await supabase
        .from('exams')
        .select('key, title, questions, duration, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (exams && exams.length > 0) {
        const totalExams = exams.length;
        const questionsCount = exams.reduce((sum, exam) => {
          return sum + (Array.isArray(exam.questions) ? exam.questions.length : 0);
        }, 0);

        setExamCount(totalExams);
        setTotalQuestions(questionsCount);
        setRecentExams(exams.slice(0, 5));
      } else {
        setExamCount(0);
        setTotalQuestions(0);
        setRecentExams([]);
      }
    } catch (error) {
      console.error('Error loading teacher stats:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  loadTeacherStats();
}, [user.id]);

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
          <Text style={styles.role}>Teacher Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.examStatCard]}>
            <Text style={styles.statNumber}>{examCount}</Text>
            <Text style={styles.statLabel}>Total Exams</Text>
          </View>
          <View style={[styles.statCard, styles.questionsStatCard]}>
            <Text style={styles.statNumber}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => onNavigate('create')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>➕</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create New Exam</Text>
              <Text style={styles.actionDescription}>
                Design questions and set exam parameters
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              Alert.alert('Coming Soon', 'Question Bank feature coming soon!');
            }}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📚</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Question Bank</Text>
              <Text style={styles.actionDescription}>
                Manage and organize your questions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              Alert.alert('Coming Soon', 'Batch Management feature coming soon!');
            }}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>👥</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Batches</Text>
              <Text style={styles.actionDescription}>
                View and manage student batches
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              Alert.alert('Coming Soon', 'Analytics feature coming soon!');
            }}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Analytics</Text>
              <Text style={styles.actionDescription}>
                Track student performance and insights
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Exams */}
        {recentExams.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Exams</Text>
            {recentExams.map((exam) => (
              <View key={exam.key} style={styles.examCard}>
                <View style={styles.examHeader}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <View style={styles.examKeyBadge}>
                    <Text style={styles.examKeyText}>{exam.key}</Text>
                  </View>
                </View>
                <View style={styles.examDetails}>
                  <Text style={styles.examDetail}>
                    📝 {Array.isArray(exam.questions) ? exam.questions.length : 0} questions
                  </Text>
                  <Text style={styles.examDetail}>
                    ⏱️ {exam.duration} seconds
                  </Text>
                  <Text style={styles.examDetail}>
                    📅 {new Date(exam.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No exams created yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first exam to get started
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => onNavigate('create')}
              >
                <Text style={styles.createButtonText}>+ Create Exam</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  examStatCard: {
    backgroundColor: '#ede9fe',
  },
  questionsStatCard: {
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  examCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  examKeyBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  examKeyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  examDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  examDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherDashboard;