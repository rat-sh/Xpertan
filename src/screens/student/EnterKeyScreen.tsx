import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { Exam, Mode } from '../../types';
import { supabase } from '../../config/supabase';
import { transformExamFromDB } from '../../utils/transformers';

interface EnterKeyScreenProps {
  onLoadExam: (exam: Exam) => void;
  onNavigate: (mode: Mode) => void;
}

const EnterKeyScreen: React.FC<EnterKeyScreenProps> = ({ 
  onLoadExam, 
  onNavigate 
}) => {
  const [examKey, setExamKey] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadExam = async (): Promise<void> => {
    if (!examKey.trim()) {
      Alert.alert('Error', 'Please enter exam key');
      return;
    }

    const cleanKey = examKey.toUpperCase().trim();

    setLoading(true);

    try {
      console.log('[EXAM LOAD] Fetching exam with key:', cleanKey);
      
      // ✅ CRITICAL: Fetch with id field included
      const { data: examData, error } = await supabase
        .from('exams')
        .select('id, title, key, questions, duration, negative_marking, positive_marks, teacher_id, batch_id, created_at')
        .eq('key', cleanKey)
        .single();

      if (error) {
        console.error('[EXAM LOAD] Supabase error:', error);
        if (error.code === 'PGRST116') {
          Alert.alert('Invalid Key', 'No exam found with this key. Please check and try again.');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      if (!examData.id) {
        console.error('[EXAM LOAD] CRITICAL: Exam missing ID field!', examData);
        Alert.alert('Error', 'Invalid exam data. Please contact your teacher.');
        setLoading(false);
        return;
      }

      // Convert database format to Exam type
      const exam = transformExamFromDB(examData);
      
      console.log('[EXAM LOAD] Exam loaded successfully:', {
        id: exam.id,
        key: exam.key,
        title: exam.title,
        questionCount: exam.questions?.length || 0,
      });

      // Validate exam has questions
      if (!exam.questions || exam.questions.length === 0) {
        Alert.alert('Error', 'This exam has no questions');
        setLoading(false);
        return;
      }


      setLoading(false);

      // Show exam details before starting
      Alert.alert(
        'Exam Found!',
        `Title: ${exam.title}\nQuestions: ${exam.questions.length}\nDuration: ${exam.duration} seconds\nMarks per Question: ${exam.positiveMarks}\nNegative Marking: -${exam.negativeMarking}\n\nReady to start?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Exam',
            onPress: () => onLoadExam(exam),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error loading exam:', error);
      Alert.alert('Error', error.message || 'Failed to load exam. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Enter Exam Key</Text>
        <Text style={commonStyles.headerSubtitle}>
          Get the exam key from your teacher
        </Text>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔑</Text>
        </View>

        <Text style={styles.instructionTitle}>How to join exam:</Text>
        <View style={styles.instructionsList}>
          <Text style={styles.instructionText}>1. Get exam key from your teacher</Text>
          <Text style={styles.instructionText}>2. Enter the 6-character key below</Text>
          <Text style={styles.instructionText}>3. Start your exam</Text>
        </View>

        <Text style={commonStyles.label}>Exam Key</Text>
        <TextInput
          style={[commonStyles.input, styles.keyInput]}
          placeholder="Enter 6-digit key (e.g., ABC123)"
          value={examKey}
          onChangeText={setExamKey}
          autoCapitalize="characters"
          maxLength={6}
          editable={!loading}
        />

        <TouchableOpacity 
          style={[
            commonStyles.button,
            commonStyles.primaryButton,
            styles.startButton,
            loading && styles.disabledButton,
          ]}
          onPress={loadExam}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.buttonText}>🚀 Start Exam</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.secondaryButton]}
          onPress={() => onNavigate('dashboard')}
          disabled={loading}
        >
          <Text style={commonStyles.buttonText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Need help?</Text>
          <Text style={styles.helpText}>
            If you don't have an exam key, contact your teacher or check your email/messages for the key.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 72,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsList: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  keyInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
  },
  startButton: {
    marginTop: 16,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  helpSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default EnterKeyScreen;
