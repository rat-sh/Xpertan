import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
  Platform,
} from 'react-native';

import { Question, Mode, QuestionType, User, Exam } from '../../types';
import { generateKey } from '../../utils/helpers';
import { supabase } from '../../config/supabase';
import { transformExamToDB } from '../../utils/transformers';

// Extend Question type to include hint
interface ExtendedQuestion extends Question {
  hint?: string;
}

interface CreateExamScreenProps {
  user: User;
  onNavigate: (mode: Mode) => void;
  editExamKey?: string;
}

type ExamFormat = 'theoretical' | 'mcq';
type TimeMode = 'per_question' | 'whole_exam';

const CreateExamScreen: React.FC<CreateExamScreenProps> = ({
  user,
  onNavigate,
  editExamKey,
}) => {
  // Batch & Settings - All hooks must be at the top level
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [showBatchCard, setShowBatchCard] = useState<boolean>(false);
  const [showSettingsCard, setShowSettingsCard] = useState<boolean>(false);
  
  // Exam Settings
  const [examTitle, setExamTitle] = useState<string>('');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('30');
  const [seconds, setSeconds] = useState<string>('0');
  const [examFormat, setExamFormat] = useState<ExamFormat>('mcq');
  const [timeMode, setTimeMode] = useState<TimeMode>('whole_exam');
  
  // Question States
  const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState<string>('');
  const [questionType, setQuestionType] = useState<QuestionType>('single');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState<string>('');
  const [correctOptions, setCorrectOptions] = useState<number[]>([]);
  const [category, setCategory] = useState<string>('');
  const [questionMarks, setQuestionMarks] = useState<string>('1');
  const [questionNegativeMarks, setQuestionNegativeMarks] = useState<string>('0');

  // Text Formatting States
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [listType, setListType] = useState<'none' | 'ul' | 'ol'>('none');

  // UI States
  const [loading, setLoading] = useState<boolean>(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState<boolean>(false);
  const [examKey, setExamKey] = useState<string>('');

  // Constants
  const batches = ['Batch A', 'Batch B', 'Batch C', 'Batch D'];

  // Handlers
  const getTotalSeconds = React.useCallback((): number => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;
    return h * 3600 + m * 60 + s;
  }, [hours, minutes, seconds]);

  const handleOptionChange = React.useCallback((index: number, value: string) => {
    setOptions(prevOptions => {
      const newOptions = [...prevOptions];
      newOptions[index] = value;
      return newOptions;
    });
  }, []);

  const addOption = React.useCallback(() => {
    setOptions(prevOptions => [...prevOptions, '']);
  }, []);

  const removeOption = React.useCallback((index: number) => {
    if (options.length <= 2) {
      Alert.alert('Error', 'Minimum 2 options required');
      return;
    }
    setOptions(prevOptions => prevOptions.filter((_, i) => i !== index));
  }, [options.length]);

  const toggleCorrectOption = React.useCallback((index: number) => {
    if (questionType === 'multiple') {
      setCorrectOptions(prev => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        } else {
          return [...prev, index];
        }
      });
    }
  }, [questionType]);

  const getCorrectAnswerValue = React.useCallback((): number | number[] | null => {
    if (examFormat === 'theoretical') return 0;
    
    if (questionType === 'boolean') {
      if (!correctOption || !['0', '1'].includes(correctOption)) {
        Alert.alert('Error', 'Select True or False');
        return null;
      }
      return parseInt(correctOption, 10);
    }
    
    if (questionType === 'multiple') {
      if (correctOptions.length === 0) {
        Alert.alert('Error', 'Select at least one correct answer');
        return null;
      }
      return correctOptions.sort((a, b) => a - b);
    }
    
    if (!correctOption) {
      Alert.alert('Error', 'Please select correct option');
      return null;
    }
    return parseInt(correctOption, 10);
  }, [examFormat, questionType, correctOption, correctOptions]);

  const clearQuestionForm = React.useCallback(() => {
    setCurrentQ('');
    setOptions(['', '', '', '']);
    setCorrectOption('');
    setCorrectOptions([]);
    setQuestionMarks('1');
    setQuestionNegativeMarks('0');
    setEditingQuestionIndex(null);
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setListType('none');
  }, []);

  const addQuestion = () => {
    if (!currentQ || !category) {
      Alert.alert('Error', 'Please fill question and select category');
      return;
    }

    const correct = getCorrectAnswerValue();
    if (correct === null && examFormat !== 'theoretical') return;

    const filledOptions = options.filter((opt) => opt.trim());
    if (examFormat === 'mcq' && filledOptions.length < 2) {
      Alert.alert('Error', 'Minimum 2 options required for MCQ');
      return;
    }

    const newQuestion: ExtendedQuestion = {
      id: questions.length + 1,
      question: currentQ,
      options: examFormat === 'mcq' ? filledOptions : [],
      correct: correct || 0,
      category,
      type: questionType,
      marks: parseFloat(questionMarks) || 1,
    };

    setQuestions([...questions, newQuestion]);
    clearQuestionForm();
    setCategory(category);
  };

  const modifyQuestion = () => {
    if (editingQuestionIndex === null) return;

    const correct = getCorrectAnswerValue();
    if (correct === null && examFormat !== 'theoretical') return;

    const filledOptions = options.filter((opt) => opt.trim());
    
    const updatedQuestion: ExtendedQuestion = {
      id: editingQuestionIndex + 1,
      question: currentQ,
      options: examFormat === 'mcq' ? filledOptions : [],
      correct: correct || 0,
      category,
      type: questionType,
      marks: parseFloat(questionMarks) || 1,
    };

    const updatedQuestions = [...questions];
    updatedQuestions[editingQuestionIndex] = updatedQuestion;
    setQuestions(updatedQuestions);
    clearQuestionForm();
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    setCurrentQ(question.question);
    setCategory(question.category);
    setQuestionType(question.type);
    setQuestionMarks((question.marks || 1).toString());
    
    if (examFormat === 'mcq') {
      const minOptions = Math.max(4, question.options.length);
      const paddedOptions = question.options.concat(Array(minOptions - question.options.length).fill(''));
      setOptions(paddedOptions);
      
      if (question.type === 'multiple') {
        setCorrectOptions(question.correct as number[]);
      } else {
        setCorrectOption(String(question.correct));
      }
    }
    
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index: number) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            const reindexed = updatedQuestions.map((q, idx) => ({ ...q, id: idx + 1 }));
            setQuestions(reindexed);
            if (editingQuestionIndex === index) clearQuestionForm();
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    if (questions.length === 0) {
      Alert.alert('Info', 'Add at least one question to preview');
      return;
    }
    setIsPreviewModalVisible(true);
  };

  const saveExam = async () => {
    if (!examTitle || !selectedBatch || questions.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and add questions');
      return;
    }

    setLoading(true);

    try {
      const key = editExamKey || generateKey();
      setExamKey(key);
      
      const exam: Exam = {
        id: '',
        title: examTitle,
        key: key,
        questions: questions,
        duration: getTotalSeconds(),
        negativeMarking: 0,
        positiveMarks: 1,
        teacherId: user.id,
        batchId: selectedBatch,
        createdAt: new Date().toISOString(),
      };
      
      const examData = transformExamToDB(exam);
      delete examData.id;
      
      const { error } = await supabase
        .from('exams')
        .insert(examData);

      if (error) throw error;

      Alert.alert('Success', `Exam created successfully!\nExam Key: ${key}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  const downloadExam = () => {
    Alert.alert('Download', 'Exam PDF will be downloaded');
  };

  const launchExam = () => {
    if (!examKey) {
      Alert.alert('Error', 'Please save the exam first to get the key');
      return;
    }
    Alert.alert('Launch', `Exam launched with key: ${examKey}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Preview Modal */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={isPreviewModalVisible}
        onRequestClose={() => setIsPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{examTitle || 'Exam Preview'}</Text>
            <Text style={styles.modalSubtitle}>
              Batch: {selectedBatch} | Duration: {hours}h {minutes}m {seconds}s | Format: {examFormat.toUpperCase()}
            </Text>
            <ScrollView style={styles.modalScrollView}>
              {questions.map((q, idx) => (
                <View key={q.id} style={styles.previewQuestion}>
                  <Text style={styles.previewQuestionText}>
                    Q{idx + 1}. {q.question}
                  </Text>
                  <Text style={styles.previewMarks}>Marks: {q.marks || 1}</Text>
                  {examFormat === 'mcq' && q.options.map((opt, i) => (
                    <Text key={i} style={styles.previewOption}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </Text>
                  ))}
                  <Text style={styles.previewCategory}>{q.category}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setIsPreviewModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {editExamKey ? 'Edit Examination' : 'Create New Examination'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Top Section: Batch Selection + Exam Settings in Row */}
          <View style={styles.topRow}>
            {/* Batch Selection Conditional */}
            <View style={styles.halfWidth}>
              <TouchableOpacity
                style={styles.selectorToggle}
                onPress={() => setShowBatchCard(!showBatchCard)}
              >
                <Text style={styles.selectorToggleText}>
                  {selectedBatch || 'Select Batch'}
                </Text>
                <Text style={styles.selectorToggleIcon}>
                  {showBatchCard ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              
              {showBatchCard && (
                <View style={styles.conditionalCard}>
                  <View style={styles.batchGrid}>
                    {batches.map((batch) => (
                      <TouchableOpacity
                        key={batch}
                        style={[
                          styles.batchChip,
                          selectedBatch === batch && styles.batchChipSelected,
                        ]}
                        onPress={() => {
                          setSelectedBatch(batch);
                          setShowBatchCard(false);
                        }}
                      >
                        <Text style={[
                          styles.batchChipText,
                          selectedBatch === batch && styles.batchChipTextSelected,
                        ]}>
                          {batch}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Exam Settings Conditional */}
            <View style={styles.halfWidth}>
              <TouchableOpacity
                style={styles.selectorToggle}
                onPress={() => setShowSettingsCard(!showSettingsCard)}
              >
                <Text style={styles.selectorToggleText}>Exam Settings</Text>
                <Text style={styles.selectorToggleIcon}>
                  {showSettingsCard ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              
              {showSettingsCard && (
                <View style={styles.conditionalCard}>
                  {/* Duration in H:M:S */}
                  <Text style={styles.label}>Duration</Text>
                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputGroup}>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        value={hours}
                        onChangeText={setHours}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.timeLabel}>H</Text>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeInputGroup}>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="30"
                        placeholderTextColor="#9ca3af"
                        value={minutes}
                        onChangeText={setMinutes}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.timeLabel}>M</Text>
                    </View>
                    <Text style={styles.timeSeparator}>:</Text>
                    <View style={styles.timeInputGroup}>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        value={seconds}
                        onChangeText={setSeconds}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.timeLabel}>S</Text>
                    </View>
                  </View>

                  {/* Time Mode */}
                  <Text style={styles.label}>Time Allocation</Text>
                  <View style={styles.timeModeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.timeModeBtn,
                        timeMode === 'per_question' && styles.timeModeBtnSelected,
                      ]}
                      onPress={() => setTimeMode('per_question')}
                    >
                      <Text style={styles.timeModeText}>Per Question</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timeModeBtn,
                        timeMode === 'whole_exam' && styles.timeModeBtnSelected,
                      ]}
                      onPress={() => setTimeMode('whole_exam')}
                    >
                      <Text style={styles.timeModeText}>Whole Exam</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Exam Title */}
          <View style={styles.card}>
            <Text style={styles.label}>Examination Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter exam title"
              placeholderTextColor="#9ca3af"
              value={examTitle}
              onChangeText={setExamTitle}
            />
          </View>

          {/* Exam Format + Category in same card */}
          <View style={styles.card}>
            <Text style={styles.label}>Exam Format</Text>
            <View style={styles.formatContainer}>
              <TouchableOpacity
                style={[
                  styles.formatBtn,
                  examFormat === 'theoretical' && styles.formatBtnSelected,
                ]}
                onPress={() => setExamFormat('theoretical')}
              >
                <Text style={styles.formatText}>Theoretical</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formatBtn,
                  examFormat === 'mcq' && styles.formatBtnSelected,
                ]}
                onPress={() => setExamFormat('mcq')}
              >
                <Text style={styles.formatText}>MCQ Based</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Physics, Mathematics, Chemistry"
              placeholderTextColor="#9ca3af"
              value={category}
              onChangeText={setCategory}
            />
          </View>

          {/* Question Entry Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {editingQuestionIndex !== null 
                ? `Modify Question ${editingQuestionIndex + 1}` 
                : `Question ${questions.length + 1}`}
            </Text>

            {/* Text Formatting Toolbar */}
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={[styles.toolbarBtn, isBold && styles.toolbarBtnActive]}
                onPress={() => setIsBold(!isBold)}
              >
                <Text style={[styles.toolbarText, isBold && styles.toolbarTextActive]}>B</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarBtn, isItalic && styles.toolbarBtnActive]}
                onPress={() => setIsItalic(!isItalic)}
              >
                <Text style={[styles.toolbarTextItalic, isItalic && styles.toolbarTextActive]}>I</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarBtn, isUnderline && styles.toolbarBtnActive]}
                onPress={() => setIsUnderline(!isUnderline)}
              >
                <Text style={[styles.toolbarText, isUnderline && styles.toolbarTextActive]}>U</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarBtn, listType === 'ul' && styles.toolbarBtnActive]}
                onPress={() => setListType(listType === 'ul' ? 'none' : 'ul')}
              >
                <Text style={styles.toolbarText}>UL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarBtn, listType === 'ol' && styles.toolbarBtnActive]}
                onPress={() => setListType(listType === 'ol' ? 'none' : 'ol')}
              >
                <Text style={styles.toolbarText}>OL</Text>
              </TouchableOpacity>
            </View>

            {/* Question Input */}
            <Text style={styles.label}>Question</Text>
            <TextInput
              style={[styles.textArea]}
              placeholder="e.g., State Newton's Third Law of Motion"
              placeholderTextColor="#9ca3af"
              value={currentQ}
              onChangeText={setCurrentQ}
              multiline
            />

            {/* Conditional: Theoretical or MCQ */}
            {examFormat === 'theoretical' ? (
              <View style={styles.theoreticalInfo}>
                <Text style={styles.infoText}>Theoretical question format selected</Text>
              </View>
            ) : (
              <>
                {/* MCQ Section */}
                <View style={styles.mcqHeader}>
                  <Text style={styles.label}>Answer Type</Text>
                  <View style={styles.mcqTypeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.mcqTypeBtn,
                        questionType === 'single' && styles.mcqTypeBtnSelected,
                      ]}
                      onPress={() => {
                        setQuestionType('single');
                        setCorrectOptions([]);
                      }}
                    >
                      <Text style={styles.mcqTypeText}>Single</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.mcqTypeBtn,
                        questionType === 'multiple' && styles.mcqTypeBtnSelected,
                      ]}
                      onPress={() => {
                        setQuestionType('multiple');
                        setCorrectOption('');
                      }}
                    >
                      <Text style={styles.mcqTypeText}>Multiple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.mcqTypeBtn,
                        questionType === 'boolean' && styles.mcqTypeBtnSelected,
                      ]}
                      onPress={() => {
                        setQuestionType('boolean');
                        setOptions(['True', 'False']);
                        setCorrectOption('');
                        setCorrectOptions([]);
                      }}
                    >
                      <Text style={styles.mcqTypeText}>True/False</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Marks and Negative Marks Row */}
                <View style={styles.marksRow}>
                  <View style={styles.marksItem}>
                    <Text style={styles.label}>Marks</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1"
                      placeholderTextColor="#9ca3af"
                      value={questionMarks}
                      onChangeText={setQuestionMarks}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.marksItem}>
                    <Text style={styles.label}>Negative Marks</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={questionNegativeMarks}
                      onChangeText={setQuestionNegativeMarks}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Options */}
                {options.map((option, idx) => (
                  <View key={idx} style={styles.optionRow}>
                    {questionType === 'multiple' ? (
                      <TouchableOpacity
                        style={[
                          styles.checkbox,
                          correctOptions.includes(idx) && styles.checkboxSelected,
                        ]}
                        onPress={() => toggleCorrectOption(idx)}
                      >
                        {correctOptions.includes(idx) && (
                          <View style={styles.checkboxInner} />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.radio,
                          correctOption === String(idx) && styles.radioSelected,
                        ]}
                        onPress={() => setCorrectOption(String(idx))}
                      >
                        {correctOption === String(idx) && (
                          <View style={styles.radioInner} />
                        )}
                      </TouchableOpacity>
                    )}

                    <TextInput
                      style={[styles.input, styles.optionInput]}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      placeholderTextColor="#9ca3af"
                      value={option}
                      onChangeText={(val) => handleOptionChange(idx, val)}
                      editable={questionType !== 'boolean'}
                    />

                    {questionType !== 'boolean' && options.length > 2 && (
                      <TouchableOpacity onPress={() => removeOption(idx)}>
                        <Text style={styles.deleteBtn}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {questionType !== 'boolean' && (
                  <View style={styles.addImageRow}>
                    <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                      <Text style={styles.addOptionText}>Add Option</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addImageBtn}>
                      <Text style={styles.addImageText}>Add Image</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Question Action Buttons */}
            <View style={styles.questionActions}>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={editingQuestionIndex !== null ? modifyQuestion : addQuestion}
              >
                <Text style={styles.actionBtnText}>
                  {editingQuestionIndex !== null ? 'Update' : 'Add Next'}
                </Text>
              </TouchableOpacity>
              
              {editingQuestionIndex !== null && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.deleteActionBtn]} 
                    onPress={() => deleteQuestion(editingQuestionIndex)}
                  >
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.cancelActionBtn]} 
                    onPress={clearQuestionForm}
                  >
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.previewActionBtn]} 
                onPress={handlePreview}
              >
                <Text style={styles.actionBtnText}>Preview</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Questions List */}
          {questions.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Added Questions ({questions.length})</Text>
              {questions.map((q, idx) => (
                <TouchableOpacity
                  key={q.id}
                  style={styles.questionItem}
                  onPress={() => editQuestion(idx)}
                >
                  <View style={styles.questionItemContent}>
                    <Text style={styles.questionItemText}>
                      Q{idx + 1}. {q.question.substring(0, 60)}...
                    </Text>
                    <View style={styles.questionItemMeta}>
                      <Text style={styles.questionItemCategory}>{q.category}</Text>
                      <Text style={styles.questionItemMarks}>{q.marks || 1} marks</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.dashboardBtn]}
            onPress={() => onNavigate('dashboard')}
            disabled={loading}
          >
            <Text style={styles.dashboardIcon}>◀</Text>
            <Text style={styles.footerBtnText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerBtn, styles.saveBtn]}
            onPress={saveExam}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.footerBtnText}>Save Exam</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.downloadBtn]}
            onPress={downloadExam}
            disabled={loading || questions.length === 0}
          >
            <Text style={styles.footerBtnText}>Download PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerBtn, styles.launchBtn]}
            onPress={launchExam}
            disabled={loading || !examKey}
          >
            <Text style={styles.footerBtnText}>Launch & Get Key</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
  },
  selectorToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorToggleText: {
    fontSize: 13,
    letterSpacing: 1,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  selectorToggleIcon: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  conditionalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1.5,
    color: '#1a1a1a',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    color: '#8b8b8b',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.5,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  batchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  batchChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  batchChipSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  batchChipText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#8b8b8b',
    fontWeight: '500',
  },
  batchChipTextSelected: {
    color: '#ffffff',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
    width: 60,
    fontWeight: '500',
  },
  timeLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#8b8b8b',
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 20,
    color: '#8b8b8b',
    marginHorizontal: 8,
    fontWeight: '300',
  },
  timeModeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  timeModeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  timeModeBtnSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  timeModeText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#8b8b8b',
  },
  formatContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  formatBtnSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  formatText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#8b8b8b',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  toolbarBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarBtnActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  toolbarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b8b8b',
  },
  toolbarTextItalic: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#8b8b8b',
  },
  toolbarTextActive: {
    color: '#ffffff',
  },
  theoreticalInfo: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#8b8b8b',
    fontStyle: 'italic',
  },
  mcqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  mcqTypeSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  mcqTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  mcqTypeBtnSelected: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  mcqTypeText: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#8b8b8b',
  },
  marksRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  marksItem: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#d4af37',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d4af37',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  deleteBtn: {
    fontSize: 28,
    color: '#8b8b8b',
    fontWeight: '300',
  },
  addImageRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
  },
  addOptionText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#8b8b8b',
    textTransform: 'uppercase',
  },
  addImageBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d4af37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#d4af37',
    textTransform: 'uppercase',
  },
  questionActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  deleteActionBtn: {
    backgroundColor: '#8b8b8b',
  },
  cancelActionBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewActionBtn: {
    backgroundColor: '#d4af37',
  },
  actionBtnText: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  questionItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  questionItemContent: {
    gap: 8,
  },
  questionItemText: {
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  questionItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionItemCategory: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#d4af37',
    textTransform: 'uppercase',
  },
  questionItemMarks: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#8b8b8b',
  },
  footer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  dashboardBtn: {
    backgroundColor: 'transparent',
    borderColor: '#8b8b8b',
  },
  dashboardIcon: {
    fontSize: 14,
    color: '#8b8b8b',
  },
  saveBtn: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  downloadBtn: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  launchBtn: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  footerBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#ffffff',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#8b8b8b',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  previewQuestion: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  previewQuestionText: {
    fontSize: 15,
    color: '#1a1a1a',
    letterSpacing: 0.3,
    marginBottom: 8,
    lineHeight: 22,
  },
  previewMarks: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#d4af37',
    marginBottom: 4,
  },
  previewOption: {
    fontSize: 13,
    color: '#8b8b8b',
    marginLeft: 16,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  previewCategory: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#d4af37',
    marginTop: 8,
    textTransform: 'uppercase',
    alignSelf: 'flex-end',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
});

export default CreateExamScreen;