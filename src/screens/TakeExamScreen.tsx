import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { Exam, Answers } from '../types';

interface TakeExamScreenProps {
  exam: Exam;
  onSubmit: (answers: Answers) => void;
}

const TakeExamScreen: React.FC<TakeExamScreenProps> = ({ exam, onSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});

  const question = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  const selectAnswer = (questionId: number, optionIndex: number): void => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const nextQuestion = (): void => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitExam = (): void => {
    onSubmit(answers);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>{exam.title}</Text>
        <Text style={commonStyles.headerSubtitle}>
          Question {currentQuestionIndex + 1} of {exam.questions.length}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.questionContainer}>
          <Text style={styles.categoryBadge}>{question.category}</Text>
          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  answers[question.id] === idx && styles.selectedOption
                ]}
                onPress={() => selectAnswer(question.id, idx)}
              >
                <View style={[
                  styles.radio,
                  answers[question.id] === idx && styles.radioSelected
                ]} />
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={commonStyles.footer}>
        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.secondaryButton, commonStyles.footerButtonLeft]}
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={commonStyles.buttonText}>Back</Text>
        </TouchableOpacity>

        {currentQuestionIndex === exam.questions.length - 1 ? (
          <TouchableOpacity 
            style={[commonStyles.button, commonStyles.primaryButton, commonStyles.footerButtonRight]}
            onPress={submitExam}
          >
            <Text style={commonStyles.buttonText}>Submit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[commonStyles.button, commonStyles.primaryButton, commonStyles.footerButtonRight]}
            onPress={nextQuestion}
          >
            <Text style={commonStyles.buttonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
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
  questionContainer: {
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    color: '#1f2937',
    lineHeight: 26,
    marginBottom: 20,
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
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
});

export default TakeExamScreen;