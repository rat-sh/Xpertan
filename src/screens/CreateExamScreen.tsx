import React, { useState } from 'react';
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
import { commonStyles } from '../styles/commonStyles';
import { Question, Exams, Mode } from '../types';
import { generateKey } from '../utils/helpers';

interface CreateExamScreenProps {
  exams: Exams;
  onSaveExam: (exams: Exams) => void;
  onNavigate: (mode: Mode) => void;
}

const CreateExamScreen: React.FC<CreateExamScreenProps> = ({ 
  exams, 
  onSaveExam, 
  onNavigate 
}) => {
  const [examTitle, setExamTitle] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<string>('');
  const [option1, setOption1] = useState<string>('');
  const [option2, setOption2] = useState<string>('');
  const [option3, setOption3] = useState<string>('');
  const [option4, setOption4] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<string>('');
  const [category, setCategory] = useState<string>('');

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
    const newExam = {
      title: examTitle,
      questions: questions,
      key: key,
      createdAt: new Date().toISOString(),
    };

    const updatedExams = { ...exams, [key]: newExam };
    onSaveExam(updatedExams);
    
    Alert.alert('Exam Created!', `Your exam key is: ${key}\nShare this key with students.`);
    
    setExamTitle('');
    setQuestions([]);
    onNavigate('home');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Create Exam</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <Text style={commonStyles.label}>Exam Title</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Enter exam title"
            value={examTitle}
            onChangeText={setExamTitle}
          />

          <Text style={styles.sectionTitle}>Add Question #{questions.length + 1}</Text>

          <Text style={commonStyles.label}>Category</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="e.g., Logical Reasoning"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={commonStyles.label}>Question</Text>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            placeholder="Enter question"
            value={currentQ}
            onChangeText={setCurrentQ}
            multiline
          />

          <Text style={commonStyles.label}>Option 1</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Option 1"
            value={option1}
            onChangeText={setOption1}
          />

          <Text style={commonStyles.label}>Option 2</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Option 2"
            value={option2}
            onChangeText={setOption2}
          />

          <Text style={commonStyles.label}>Option 3</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Option 3"
            value={option3}
            onChangeText={setOption3}
          />

          <Text style={commonStyles.label}>Option 4</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Option 4"
            value={option4}
            onChangeText={setOption4}
          />

          <Text style={commonStyles.label}>Correct Option (1-4)</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Enter 1, 2, 3, or 4"
            value={correctOption}
            onChangeText={setCorrectOption}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
            <Text style={commonStyles.buttonText}>Add Question</Text>
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

      <View style={commonStyles.footer}>
        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.secondaryButton, commonStyles.footerButtonLeft]}
          onPress={() => onNavigate('home')}
        >
          <Text style={commonStyles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.primaryButton, commonStyles.footerButtonRight]}
          onPress={saveExam}
        >
          <Text style={commonStyles.buttonText}>Save & Get Key</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
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
    marginTop: 8,
  },
});

export default CreateExamScreen;