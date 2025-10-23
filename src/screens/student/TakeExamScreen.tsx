// src/screens/student/TakeExamScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { Exam, Answers } from '../../types';
import Timer from '../../components/Timer';

interface TakeExamScreenProps {
  exam: Exam;
  onSubmit: (answers: Answers, questionTimes: { [key: number]: number }) => void;
}

const TakeExamScreen: React.FC<TakeExamScreenProps> = ({ exam, onSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [questionTimes, setQuestionTimes] = useState<{ [key: number]: number }>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const question = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const totalDuration = exam.duration * 60; // Convert minutes to seconds

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const recordQuestionTime = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    setQuestionTimes(prev => ({
      ...prev,
      [question.id]: (prev[question.id] || 0) + timeSpent,
    }));
  };

  const selectAnswer = (questionId: number, optionIndex: number): void => {
  if (question.type === 'multiple') {
    // Multiple choice - toggle selection
    const currentAnswers = Array.isArray(answers[questionId]) 
      ? [...(answers[questionId] as number[])] 
      : [];
    
    if (currentAnswers.includes(optionIndex)) {
      // Remove if already selected
      const newAnswers = currentAnswers.filter(idx => idx !== optionIndex);
      
      if (newAnswers.length > 0) {
        setAnswers({ 
          ...answers, 
          [questionId]: newAnswers 
        });
      } else {
        // Remove the key entirely if no answers selected
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [questionId]: _, ...rest } = answers;
        setAnswers(rest);
      }
    } else {
      // Add to selection
      setAnswers({ 
        ...answers, 
        [questionId]: [...currentAnswers, optionIndex] 
      });
    }
  } else {
    // Single choice or boolean
    setAnswers({ ...answers, [questionId]: optionIndex });
  }
};

  const nextQuestion = (): void => {
    recordQuestionTime();
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = (): void => {
    recordQuestionTime();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitExam = (): void => {
    recordQuestionTime();
    
    const unansweredCount = exam.questions.length - Object.keys(answers).length;
    
    if (unansweredCount > 0) {
      Alert.alert(
        'Submit Exam',
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Submit', 
            onPress: () => onSubmit(answers, questionTimes)
          }
        ]
      );
    } else {
      Alert.alert(
        'Submit Exam',
        'Are you sure you want to submit? You cannot change answers after submission.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Submit', 
            onPress: () => onSubmit(answers, questionTimes)
          }
        ]
      );
    }
  };

  const handleTimeUp = (): void => {
    Alert.alert('Time Up!', 'Your exam time has ended. Submitting automatically...');
    setTimeout(() => {
      recordQuestionTime();
      onSubmit(answers, questionTimes);
    }, 1000);
  };

  // Check if current question is answered
  const isAnswered = (questionId: number): boolean => {
    const answer = answers[questionId];
    if (answer === undefined) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={commonStyles.headerTitle}>{exam.title}</Text>
            <Text style={commonStyles.headerSubtitle}>
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </Text>
          </View>
          <Timer duration={totalDuration} onTimeUp={handleTimeUp} />
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Answered: {Object.keys(answers).length} / {exam.questions.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.questionContainer}>
          <View style={styles.questionHeader}>
            <Text style={styles.categoryBadge}>{question.category}</Text>
            <Text style={styles.marksBadge}>
              {question.marks || exam.positiveMarks} marks
            </Text>
          </View>

          <Text style={styles.questionText}>{question.question}</Text>

          {question.type === 'multiple' && (
            <Text style={styles.multipleChoiceHint}>
              💡 Select all correct answers
            </Text>
          )}

          <View style={styles.optionsContainer}>
            {question.options.map((option, idx) => {
              const isSelected = question.type === 'multiple'
                ? Array.isArray(answers[question.id]) && (answers[question.id] as unknown as number[]).includes(idx)
                : answers[question.id] === idx;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption
                  ]}
                  onPress={() => selectAnswer(question.id, idx)}
                >
                  {question.type === 'multiple' ? (
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  ) : (
                    <View style={[
                      styles.radio,
                      isSelected && styles.radioSelected
                    ]} />
                  )}
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Question Navigation Dots */}
          <View style={styles.navigationDots}>
            <Text style={styles.navigationTitle}>Question Navigator:</Text>
            <View style={styles.dotsContainer}>
              {exam.questions.map((q, idx) => (
                <View key={idx} style={styles.dotWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.dot,
                      isAnswered(q.id) && styles.dotAnswered,
                      idx === currentQuestionIndex && styles.dotCurrent
                    ]}
                    onPress={() => {
                      recordQuestionTime();
                      setCurrentQuestionIndex(idx);
                    }}
                  >
                    <Text style={[
                      styles.dotText,
                      isAnswered(q.id) && styles.dotAnsweredText,
                      idx === currentQuestionIndex && styles.dotCurrentText
                    ]}>
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={commonStyles.footer}>
        <TouchableOpacity 
          style={[
            commonStyles.button, 
            commonStyles.secondaryButton, 
            commonStyles.footerButtonLeft,
            currentQuestionIndex === 0 && styles.disabledButton
          ]}
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={commonStyles.buttonText}>⬅️ Back</Text>
        </TouchableOpacity>

        {currentQuestionIndex === exam.questions.length - 1 ? (
          <TouchableOpacity 
            style={[commonStyles.button, styles.submitButton, commonStyles.footerButtonRight]}
            onPress={submitExam}
          >
            <Text style={commonStyles.buttonText}>✓ Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[commonStyles.button, commonStyles.primaryButton, commonStyles.footerButtonRight]}
            onPress={nextQuestion}
          >
            <Text style={commonStyles.buttonText}>Next ➡️</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  questionContainer: {
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  marksBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: '500',
  },
  multipleChoiceHint: {
    fontSize: 13,
    color: '#7c3aed',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#7c3aed',
    fontWeight: '500',
  },
  navigationDots: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navigationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4, // Negative margin to offset wrapper margins
  },
  dotWrapper: {
    margin: 4, // Creates spacing between dots (replaces gap)
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dotAnswered: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  dotCurrent: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  dotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dotAnsweredText: {
    color: '#10b981',
  },
  dotCurrentText: {
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: '#10b981',
  },
});

export default TakeExamScreen;