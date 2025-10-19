import React, { useState } from 'react';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: string;
}

interface Exam {
  title: string;
  questions: Question[];
  key: string;
  createdAt: string;
}

interface Exams {
  [key: string]: Exam;
}

interface Answers {
  [key: number]: number;
}

interface CategoryScore {
  correct: number;
  total: number;
}

interface CategoryScores {
  [key: string]: CategoryScore;
}

type Mode = 'home' | 'create' | 'answer' | 'answerSetup';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('home');
  const [exams, setExams] = useState<Exams>({});
  
  // Create Question States
  const [examTitle, setExamTitle] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<string>('');
  const [option1, setOption1] = useState<string>('');
  const [option2, setOption2] = useState<string>('');
  const [option3, setOption3] = useState<string>('');
  const [option4, setOption4] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  
  // Answer States
  const [examKey, setExamKey] = useState<string>('');
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  const generateKey = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const addQuestion = (): void => {
    if (!currentQ || !option1 || !option2 || !option3 || !option4 || !correctOption || !category) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const newQuestion: Question = {
      id: questions.length + 1,
      question: currentQ,
      options: [option1, option2, option3, option4],
      correct: parseInt(correctOption, 10) - 1,
      category: category,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQ('');
    setOption1('');
    setOption2('');
    setOption3('');
    setOption4('');
    setCorrectOption('');
    setCategory('');
    Alert.alert('Success', 'Question added!');
  };

  const saveExam = (): void => {
    if (!examTitle || questions.length === 0) {
      Alert.alert('Error', 'Add title and at least one question');
      return;
    }

    const key = generateKey();
    const newExam: Exam = {
      title: examTitle,
      questions: questions,
      key: key,
      createdAt: new Date().toISOString(),
    };

    setExams({ ...exams, [key]: newExam });
    Alert.alert('Exam Created!', `Your exam key is: ${key}\nShare this key with students.`);
    
    setExamTitle('');
    setQuestions([]);
    setMode('home');
  };

  const loadExam = (): void => {
    if (!examKey) {
      Alert.alert('Error', 'Please enter exam key');
      return;
    }

    const exam = exams[examKey.toUpperCase()];
    if (!exam) {
      Alert.alert('Error', 'Invalid exam key');
      return;
    }

    setCurrentExam(exam);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setMode('answer');
  };

  const selectAnswer = (questionId: number, optionIndex: number): void => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const nextQuestion = (): void => {
    if (currentExam && currentQuestionIndex < currentExam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitExam = (): void => {
    setShowResults(true);
  };

  const calculateResults = () => {
    if (!currentExam) return null;

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

  // HOME SCREEN
  if (mode === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aptitude Exam App</Text>
          <Text style={styles.headerSubtitle}>ML-Based Assessment Platform</Text>
        </View>

        <View style={styles.homeButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={() => setMode('create')}
          >
            <Text style={styles.buttonText}>Create Questions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setMode('answerSetup')}
          >
            <Text style={styles.buttonText}>Answer Exam</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // CREATE QUESTIONS SCREEN
  if (mode === 'create') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Exam</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            <Text style={styles.label}>Exam Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter exam title"
              value={examTitle}
              onChangeText={setExamTitle}
            />

            <Text style={styles.sectionTitle}>Add Question #{questions.length + 1}</Text>

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Logical Reasoning"
              value={category}
              onChangeText={setCategory}
            />

            <Text style={styles.label}>Question</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter question"
              value={currentQ}
              onChangeText={setCurrentQ}
              multiline
            />

            <Text style={styles.label}>Option 1</Text>
            <TextInput
              style={styles.input}
              placeholder="Option 1"
              value={option1}
              onChangeText={setOption1}
            />

            <Text style={styles.label}>Option 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Option 2"
              value={option2}
              onChangeText={setOption2}
            />

            <Text style={styles.label}>Option 3</Text>
            <TextInput
              style={styles.input}
              placeholder="Option 3"
              value={option3}
              onChangeText={setOption3}
            />

            <Text style={styles.label}>Option 4</Text>
            <TextInput
              style={styles.input}
              placeholder="Option 4"
              value={option4}
              onChangeText={setOption4}
            />

            <Text style={styles.label}>Correct Option (1-4)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 1, 2, 3, or 4"
              value={correctOption}
              onChangeText={setCorrectOption}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
              <Text style={styles.buttonText}>Add Question</Text>
            </TouchableOpacity>

            {questions.length > 0 && (
              <View style={styles.questionList}>
                <Text style={styles.questionCount}>
                  Questions Added: {questions.length}
                </Text>
                {questions.map((q, idx) => (
                  <View key={idx} style={styles.questionItem}>
                    <Text style={styles.questionItemText}>
                      {idx + 1}. {q.question.substring(0, 50)}...
                    </Text>
                    <Text style={styles.categoryBadge}>{q.category}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, styles.footerButtonLeft]}
            onPress={() => setMode('home')}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, styles.footerButtonRight]}
            onPress={saveExam}
          >
            <Text style={styles.buttonText}>Save & Get Key</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ANSWER SETUP SCREEN
  if (mode === 'answerSetup') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Enter Exam Key</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.label}>Exam Key</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit key"
            value={examKey}
            onChangeText={setExamKey}
            autoCapitalize="characters"
            maxLength={6}
          />

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={loadExam}
          >
            <Text style={styles.buttonText}>Start Exam</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setMode('home')}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // RESULTS SCREEN
  if (mode === 'answer' && showResults && currentExam) {
    const results = calculateResults();
    
    if (!results) return null;

    return (
      <SafeAreaView style={styles.container}>
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
            style={[styles.button, styles.primaryButton, styles.resultsButton]}
            onPress={() => {
              setMode('home');
              setCurrentExam(null);
              setExamKey('');
            }}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ANSWER QUESTIONS SCREEN
  if (mode === 'answer' && currentExam) {
    const question = currentExam.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentExam.questions.length) * 100;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{currentExam.title}</Text>
          <Text style={styles.headerSubtitle}>
            Question {currentQuestionIndex + 1} of {currentExam.questions.length}
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

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, styles.footerButtonLeft]}
            onPress={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>

          {currentQuestionIndex === currentExam.questions.length - 1 ? (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, styles.footerButtonRight]}
              onPress={submitExam}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, styles.footerButtonRight]}
              onPress={nextQuestion}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#7c3aed',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  homeButtons: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  questionList: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  questionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 12,
  },
  questionItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 8,
  },
  questionItemText: {
    fontSize: 14,
    color: '#374151',
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
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerButtonLeft: {
    flex: 1,
    marginRight: 8,
  },
  footerButtonRight: {
    flex: 1,
    marginLeft: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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

export default App;