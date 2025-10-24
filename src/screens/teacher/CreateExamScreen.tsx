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
  ActivityIndicator,
} from 'react-native';

import { commonStyles } from '../../styles/commonStyles';
import { Question, Mode, QuestionType, User, Exam } from '../../types';
import { generateKey } from '../../utils/helpers';
import QuestionTypeSelector from '../../components/QuestionTypeSelector';
import ImportQuestionsScreen from './ImportQuestionsScreen';
import { supabase } from '../../config/supabase';
import { transformExamToDB } from '../../utils/transformers';

interface CreateExamScreenProps {
  user: User;
  onNavigate: (mode: Mode) => void;
  editExamKey?: string; // For editing existing exam
}

const CreateExamScreen: React.FC<CreateExamScreenProps> = ({
  user,
  onNavigate,
  editExamKey,
}) => {
  const [examTitle, setExamTitle] = useState<string>('');
  const [duration, setDuration] = useState<string>('30');
  const durationOptions = ['15', '30', '45', '60'];

  const [negativeMarking, setNegativeMarking] = useState<string>('0.25');
  const [positiveMarks, setPositiveMarks] = useState<string>('1');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Question-related states
  const [currentQ, setCurrentQ] = useState<string>('');
  const [questionType, setQuestionType] = useState<QuestionType>('single');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState<string>('');
  const [correctOptions, setCorrectOptions] = useState<number[]>([]);
  const [category, setCategory] = useState<string>('');

  const [showImport, setShowImport] = useState(false);

  // Predefined categories
  const predefinedCategories = [
    'Physics',
    'Mathematics',
    'Logical Reasoning',
    'Verbal Ability',
    'Data Interpretation',
    'General Knowledge',
  ];

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'Minimum 2 options required');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const toggleCorrectOption = (index: number) => {
    if (questionType === 'multiple') {
      if (correctOptions.includes(index)) {
        setCorrectOptions(correctOptions.filter((i) => i !== index));
      } else {
        setCorrectOptions([...correctOptions, index]);
      }
    }
  };

  const addQuestion = (): void => {
    const filledOptions = options.filter((opt) => opt.trim());

    if (!currentQ || filledOptions.length < 2 || !category) {
      Alert.alert('Error', 'Please fill question, at least 2 options, and category');
      return;
    }

    let correct: number | number[];

    if (questionType === 'boolean') {
      if (!correctOption || !['0', '1'].includes(correctOption)) {
        Alert.alert('Error', 'For True/False, select True (1) or False (2)');
        return;
      }
      correct = parseInt(correctOption, 10);
    } else if (questionType === 'multiple') {
      if (correctOptions.length === 0) {
        Alert.alert('Error', 'Select at least one correct answer');
        return;
      }
      correct = correctOptions.sort((a, b) => a - b);
    } else {
      if (!correctOption) {
        Alert.alert('Error', 'Please select correct option');
        return;
      }
      correct = parseInt(correctOption, 10);
    }

    const newQuestion: Question = {
      id: questions.length + 1,
      question: currentQ,
      options: filledOptions,
      correct,
      category,
      type: questionType,
      marks: parseFloat(positiveMarks) || 1,
    };

    setQuestions([...questions, newQuestion]);

    // Clear only question and options, KEEP category
    setCurrentQ('');
    setOptions(['', '', '', '']);
    setCorrectOption('');
    setCorrectOptions([]);

    Alert.alert('Success', `Question added! Category "${category}" kept for next question.`);
  };

  const deleteQuestion = (index: number) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            // Reassign IDs
            const reindexed = updatedQuestions.map((q, idx) => ({ ...q, id: idx + 1 }));
            setQuestions(reindexed);
          },
        },
      ]
    );
  };

  const handleImportQuestions = (importedQuestions: Question[]) => {
    const startId = questions.length + 1;
    const withIds = importedQuestions.map((q, idx) => ({
      ...q,
      id: startId + idx,
      marks: parseFloat(positiveMarks) || 1,
    }));
    setQuestions([...questions, ...withIds]);
    setShowImport(false);
    Alert.alert('Success', `${importedQuestions.length} questions imported!`);
  };

const saveExam = async (): Promise<void> => {
  if (!examTitle || questions.length === 0) {
    Alert.alert('Error', 'Add title and at least one question');
    return;
  }

  setLoading(true);

  try {
    const key = editExamKey || generateKey();
    
    console.log('[EXAM CREATE] Creating exam with key:', key);
    
    // Prepare exam data
    const exam: Exam = {
      id: '',
      title: examTitle,
      key: key,
      questions: questions,
      duration: parseInt(duration, 10) || 30,
      negativeMarking: parseFloat(negativeMarking) || 0,
      positiveMarks: parseFloat(positiveMarks) || 1,
      teacherId: user.id,
      batchId: undefined,
      createdAt: new Date().toISOString(),
    };
    
    const examData = transformExamToDB(exam);
    delete examData.id;
    
    console.log('[EXAM CREATE] Exam data prepared:', {
      key: examData.key,
      questionCount: examData.questions?.length,
    });

    // Save to Supabase
    if (editExamKey) {
      // Update existing exam
      const { error } = await supabase
        .from('exams')
        .update(examData)
        .eq('key', editExamKey)
        .eq('teacher_id', user.id);

      if (error) {
        console.error('[EXAM CREATE] Update error:', error);
        throw error;
      }

      console.log('[EXAM CREATE] Exam updated successfully');
      Alert.alert('Success!', `Exam "${examTitle}" updated successfully!`, [
        { text: 'OK', onPress: () => onNavigate('dashboard') }
      ]);
    } else {
      // Insert new exam
      const { data, error } = await supabase
        .from('exams')
        .insert(examData)
        .select('id, key')
        .single();

      if (error) {
        console.error('[EXAM CREATE] Insert error:', error);
        throw error;
      }

      console.log('[EXAM CREATE] Exam created successfully with ID:', data?.id);
      Alert.alert(
        'Exam Created!',
        `Your exam key is: ${key}\nDuration: ${duration} seconds\n\nShare this key with students to take the exam.`,
        [
          { text: 'Create Another', onPress: resetForm },
          { text: 'Go to Dashboard', onPress: () => onNavigate('dashboard') }
        ]
      );
    }
  } catch (error: any) {
    console.error('[EXAM CREATE] Error saving exam:', error);
    Alert.alert('Error', error.message || 'Failed to save exam. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const resetForm = () => {
    setExamTitle('');
    setQuestions([]);
    setDuration('30');
    setNegativeMarking('0.25');
    setPositiveMarks('1');
    setCategory('');
  };

  if (showImport) {
    return (
      <ImportQuestionsScreen
        onImport={handleImportQuestions}
        onBack={() => setShowImport(false)}
      />
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>
          {editExamKey ? 'Edit Exam' : 'Create Exam'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Exam Settings */}
          <Text style={styles.sectionTitle}>⚙️ Exam Settings</Text>

          <Text style={commonStyles.label}>Exam Title</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Enter exam title"
            value={examTitle}
            onChangeText={setExamTitle}
            editable={!loading}
          />

          <Text style={commonStyles.label}>Duration (seconds)</Text>
          <View style={styles.durationContainer}>
            {durationOptions.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationButton,
                  duration === d && styles.durationButtonSelected,
                ]}
                onPress={() => setDuration(d)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    duration === d && styles.durationButtonTextSelected,
                  ]}
                >
                  {d}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={commonStyles.input}
            placeholder="Or enter custom duration (seconds)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            editable={!loading}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={commonStyles.label}>Marks per Question</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="1"
                value={positiveMarks}
                onChangeText={setPositiveMarks}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={commonStyles.label}>Negative Marking</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="0.25"
                value={negativeMarking}
                onChangeText={setNegativeMarking}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Import Button */}
          <TouchableOpacity
            style={styles.importButton}
            onPress={() => setShowImport(true)}
            disabled={loading}
          >
            <Text style={styles.importButtonText}>📥 Import from Text (AI Parser)</Text>
          </TouchableOpacity>

          {/* Add Question */}
          <Text style={styles.sectionTitle}>➕ Add Question #{questions.length + 1}</Text>

          {/* Category Selection */}
          <Text style={commonStyles.label}>Category (Stays for multiple questions)</Text>
          <View style={styles.categoryButtons}>
            {predefinedCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={commonStyles.input}
            placeholder="Or type custom category"
            value={category}
            onChangeText={setCategory}
            editable={!loading}
          />

          <QuestionTypeSelector
            selectedType={questionType}
            onSelect={(type) => {
              setQuestionType(type);
              setCorrectOption('');
              setCorrectOptions([]);
              if (type === 'boolean') {
                setOptions(['True', 'False']);
              } else if (options[0] === 'True') {
                setOptions(['', '', '', '']);
              }
            }}
          />

          <Text style={commonStyles.label}>Question</Text>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            placeholder="Enter question"
            value={currentQ}
            onChangeText={setCurrentQ}
            multiline
            editable={!loading}
          />

          <Text style={commonStyles.label}>
            Options {questionType === 'multiple' && '(Select all correct)'}
          </Text>

          {options.map((option, idx) => (
            <View key={idx} style={styles.optionRow}>
              {questionType === 'multiple' ? (
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    correctOptions.includes(idx) && styles.checkboxSelected,
                  ]}
                  onPress={() => toggleCorrectOption(idx)}
                  disabled={loading}
                >
                  {correctOptions.includes(idx) && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    correctOption === String(idx) && styles.radioSelected,
                  ]}
                  onPress={() => setCorrectOption(String(idx))}
                  disabled={loading}
                >
                  {correctOption === String(idx) && <View style={styles.radioInner} />}
                </TouchableOpacity>
              )}

              <TextInput
                style={[commonStyles.input, styles.optionInput]}
                placeholder={`Option ${idx + 1}`}
                value={option}
                onChangeText={(val) => handleOptionChange(idx, val)}
                editable={questionType !== 'boolean' && !loading}
              />

              {questionType !== 'boolean' && options.length > 2 && (
                <TouchableOpacity onPress={() => removeOption(idx)} disabled={loading}>
                  <Text style={styles.deleteOption}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {questionType !== 'boolean' && (
            <TouchableOpacity
              style={styles.addOptionButton}
              onPress={addOption}
              disabled={loading}
            >
              <Text style={styles.addOptionText}>➕ Add Option</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.addButton, loading && styles.disabledButton]}
            onPress={addQuestion}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>Add Question</Text>
          </TouchableOpacity>

          {questions.length > 0 && (
            <View style={styles.questionList}>
              <Text style={styles.questionCount}>Questions Added: {questions.length}</Text>
              {questions.map((q, idx) => (
                <View key={idx} style={styles.questionItem}>
                  <View style={styles.questionItemContent}>
                    <Text style={styles.questionItemText}>
                      {idx + 1}. {q.question.substring(0, 50)}...
                    </Text>
                    <Text style={styles.categoryBadge}>{q.category}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteQuestionButton}
                    onPress={() => deleteQuestion(idx)}
                    disabled={loading}
                  >
                    <Text style={styles.deleteQuestionText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={commonStyles.footer}>
        <TouchableOpacity
          style={[
            commonStyles.button,
            commonStyles.secondaryButton,
            commonStyles.footerButtonLeft,
            loading && styles.disabledButton,
          ]}
          onPress={() => onNavigate('dashboard')}
          disabled={loading}
        >
          <Text style={commonStyles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.button,
            commonStyles.primaryButton,
            commonStyles.footerButtonRight,
            loading && styles.disabledButton,
          ]}
          onPress={saveExam}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={commonStyles.buttonText}>
              {editExamKey ? 'Update Exam' : 'Save & Get Key'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  form: { padding: 20 },
  textArea: { height: 80, textAlignVertical: 'top' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  durationButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
    flexGrow: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  durationButtonSelected: { backgroundColor: '#7c3aed' },
  durationButtonText: { color: '#374151', fontWeight: '500' },
  durationButtonTextSelected: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  halfWidth: { flex: 1 },
  importButton: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginVertical: 15,
    alignItems: 'center',
  },
  importButtonText: { color: '#1d4ed8', fontWeight: '600' },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    marginHorizontal: -4,
  },
  categoryChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryChipSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  optionInput: { flex: 1, marginLeft: 10 },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#7c3aed',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7c3aed',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  checkmark: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  deleteOption: { fontSize: 18, marginLeft: 8 },
  addOptionButton: { alignSelf: 'flex-start', marginVertical: 8 },
  addOptionText: { color: '#2563eb', fontWeight: '600' },
  addButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  questionList: { marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  questionCount: { fontSize: 16, fontWeight: 'bold', color: '#7c3aed', marginBottom: 12 },
  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 8,
  },
  questionItemContent: {
    flex: 1,
  },
  questionItemText: { fontSize: 14, color: '#374151', marginBottom: 6 },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  deleteQuestionButton: {
    padding: 8,
  },
  deleteQuestionText: {
    fontSize: 20,
  },
});

export default CreateExamScreen;
