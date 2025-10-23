import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { Question, Mode, User } from '../../types';
import { supabase } from '../../config/supabase';

interface QuestionBankScreenProps {
  onNavigate: (mode: Mode) => void;
  user: User;
}

interface QuestionBank {
  id: string;
  title: string;
  category: string;
  questions: Question[];
  teacher_id: string;
  created_at: string;
}

const QuestionBankScreen: React.FC<QuestionBankScreenProps> = ({
  onNavigate,
  user,
}) => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bankTitle, setBankTitle] = useState('');
  const [bankCategory, setBankCategory] = useState('');
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const predefinedCategories = [
    'Physics',
    'Mathematics',
    'Logical Reasoning',
    'Verbal Ability',
    'Data Interpretation',
    'Aptitude',
    'coding',
    'Science',
    'Chemistry',
    'Biology',
    'school exam',
    'college exam',
  ];

  // ✅ Unified data loading function
  const loadQuestionBanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_banks')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestionBanks(data || []);
    } catch (error: any) {
      console.error('Error loading question banks:', error);
      Alert.alert('Error', 'Failed to load question banks');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load once on mount
  useEffect(() => {
    loadQuestionBanks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // ✅ Create Question Bank
  const handleCreateBank = async () => {
    if (!bankTitle.trim() || !bankCategory.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('question_banks')
        .insert({
          title: bankTitle,
          category: bankCategory,
          questions: [],
          teacher_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Question bank created!');
      setBankTitle('');
      setBankCategory('');
      setShowCreateForm(false);
      await loadQuestionBanks();
    } catch (error: any) {
      console.error('Error creating question bank:', error);
      Alert.alert('Error', error.message || 'Failed to create question bank');
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Delete Question Bank
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleDeleteBank = async (_bankId: string, bankTitle: string) => {
    Alert.alert(
      'Delete Question Bank',
      `Are you sure you want to delete "${bankTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('question_banks')
                .delete()
                .eq('id', _bankId)
                .eq('teacher_id', user.id);

              if (error) throw error;

              Alert.alert('Deleted', 'Question bank removed successfully');
              await loadQuestionBanks();
            } catch (error: any) {
              console.error('Error deleting question bank:', error);
              Alert.alert('Error', error.message || 'Failed to delete question bank');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ Edit Question Bank (fixed Alert.prompt)
  const handleEditBank = async (bankId: string, currentTitle: string, _category: string) => {
    Alert.prompt(
      'Edit Question Bank',
      'Enter new title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (newTitle?: string) => {
            if (!newTitle?.trim()) {
              Alert.alert('Error', 'Title cannot be empty');
              return;
            }

            (async () => {
              setActionLoading(true);
              try {
                const { error } = await supabase
                  .from('question_banks')
                  .update({ title: newTitle })
                  .eq('id', bankId)
                  .eq('teacher_id', user.id);

                if (error) throw error;

                Alert.alert('Success', 'Question bank updated');
                await loadQuestionBanks();
              } catch (error: any) {
                console.error('Error updating question bank:', error);
                Alert.alert('Error', error.message || 'Failed to update question bank');
              } finally {
                setActionLoading(false);
              }
            })();
          },
        },
      ],
      'plain-text',
      currentTitle
    );
  };

  const handleViewBank = (bank: QuestionBank) => {
    setSelectedBank(bank);
    setShowViewModal(true);
  };

  const handleAddQuestion = async (_bankId: string) => {
    Alert.alert(
      'Add Questions',
      'This feature allows you to add questions to the bank. You can import from text or create manually.',
      [
        {
          text: 'Import from Text',
          onPress: () => {
            Alert.alert('Coming Soon', 'Import questions from text feature');
          },
        },
        {
          text: 'Create Manually',
          onPress: () => {
            Alert.alert('Coming Soon', 'Manual question creation feature');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getTotalQuestions = () =>
    questionBanks.reduce((sum, bank) => sum + bank.questions.length, 0);

  // ✅ Loading State
  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading question banks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Main UI
  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Question Banks</Text>
        <Text style={commonStyles.headerSubtitle}>
          Manage your question collections
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Create Button */}
        {!showCreateForm && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateForm(true)}
            disabled={actionLoading}
          >
            <Text style={styles.createButtonText}>➕ Create New Bank</Text>
          </TouchableOpacity>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create Question Bank</Text>

            <Text style={commonStyles.label}>Bank Title</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g., Aptitude Test Questions"
              value={bankTitle}
              onChangeText={setBankTitle}
              editable={!actionLoading}
            />

            <Text style={commonStyles.label}>Category</Text>
            <View style={styles.categoryButtons}>
              {predefinedCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    bankCategory === cat && styles.categoryChipSelected,
                  ]}
                  onPress={() => setBankCategory(cat)}
                  disabled={actionLoading}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      bankCategory === cat && styles.categoryChipTextSelected,
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
              value={bankCategory}
              onChangeText={setBankCategory}
              editable={!actionLoading}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[commonStyles.button, commonStyles.secondaryButton, styles.formButton]}
                onPress={() => {
                  setShowCreateForm(false);
                  setBankTitle('');
                  setBankCategory('');
                }}
                disabled={actionLoading}
              >
                <Text style={commonStyles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.button,
                  commonStyles.primaryButton,
                  styles.formButton,
                  actionLoading && styles.disabledButton,
                ]}
                onPress={handleCreateBank}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={commonStyles.buttonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.bankStatCard]}>
            <Text style={styles.statNumber}>{questionBanks.length}</Text>
            <Text style={styles.statLabel}>Question Banks</Text>
          </View>
          <View style={[styles.statCard, styles.questionStatCard]}>
            <Text style={styles.statNumber}>{getTotalQuestions()}</Text>
            <Text style={styles.statLabel}>Total Questions</Text>
          </View>
        </View>

        {/* Banks List */}
        <View style={styles.banksContainer}>
          <Text style={styles.sectionTitle}>Your Question Banks</Text>
          {questionBanks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No question banks yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first question bank to get started
              </Text>
            </View>
          ) : (
            questionBanks.map((bank) => (
              <View key={bank.id} style={styles.bankCard}>
                <View style={styles.bankHeader}>
                  <View style={styles.bankTitleContainer}>
                    <Text style={styles.bankTitle}>{bank.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{bank.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBank(bank.id, bank.title)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bankStats}>
                  <Text style={styles.bankStat}>📝 {bank.questions.length} questions</Text>
                  <Text style={styles.bankDate}>
                    Created: {new Date(bank.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.bankActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => handleViewBank(bank)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionButtonText}>👁️ View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditBank(bank.id, bank.title, bank.category)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.addButton]}
                    onPress={() => handleAddQuestion(bank.id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionButtonText}>➕ Add Q</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>💡 How to Use Question Banks</Text>
          <Text style={styles.instructionText}>• Create banks to organize questions by subject/topic</Text>
          <Text style={styles.instructionText}>• Add questions manually or import from text</Text>
          <Text style={styles.instructionText}>• Reuse questions across multiple exams</Text>
          <Text style={styles.instructionText}>• Build a comprehensive question repository</Text>
          <Text style={styles.instructionText}>• Export banks for backup or sharing</Text>
        </View>
      </ScrollView>

      {/* View Modal */}
      <Modal
        visible={showViewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedBank?.title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowViewModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSubHeader}>
              <Text style={styles.modalCategory}>Category: {selectedBank?.category}</Text>
              <Text style={styles.modalCount}>{selectedBank?.questions.length || 0} Questions</Text>
            </View>

            <ScrollView style={styles.questionsList}>
              {!selectedBank || selectedBank.questions.length === 0 ? (
                <View style={styles.emptyQuestionList}>
                  <Text style={styles.emptyQuestionIcon}>📝</Text>
                  <Text style={styles.emptyQuestionText}>No questions yet</Text>
                  <Text style={styles.emptyQuestionSubtext}>
                    Add questions to this bank to start building your repository
                  </Text>
                  <TouchableOpacity
                    style={styles.addQuestionButton}
                    onPress={() => {
                      setShowViewModal(false);
                      if (selectedBank) handleAddQuestion(selectedBank.id);
                    }}
                  >
                    <Text style={styles.addQuestionButtonText}>➕ Add Questions</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                selectedBank.questions.map((question, index) => (
                  <View key={question.id} style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                      <Text style={styles.questionNumber}>Q{index + 1}</Text>
                      <View style={styles.questionTypeBadge}>
                        <Text style={styles.questionTypeText}>
                          {question.type === 'single'
                            ? '⭕ Single'
                            : question.type === 'multiple'
                            ? '☑️ Multiple'
                            : '✓✗ T/F'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.questionText} numberOfLines={2}>
                      {question.question}
                    </Text>
                    <View style={styles.questionFooter}>
                      <Text style={styles.questionCategory}>{question.category}</Text>
                      <Text style={styles.questionMarks}>{question.marks} marks</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {selectedBank && selectedBank.questions.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.addMoreButton}
                  onPress={() => {
                    setShowViewModal(false);
                    handleAddQuestion(selectedBank.id);
                  }}
                >
                  <Text style={styles.addMoreButtonText}>➕ Add More Questions</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={commonStyles.footer}>
        <TouchableOpacity
          style={[commonStyles.button, commonStyles.secondaryButton]}
          onPress={() => onNavigate('dashboard')}
          disabled={actionLoading}
        >
          <Text style={commonStyles.buttonText}>← Back</Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  createButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createForm: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
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
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  formButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  bankStatCard: {
    backgroundColor: '#ede9fe',
  },
  questionStatCard: {
    backgroundColor: '#dbeafe',
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
  banksContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
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
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bankTitleContainer: {
    flex: 1,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  bankStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bankStat: {
    fontSize: 13,
    color: '#6b7280',
  },
  bankDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bankActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#dbeafe',
  },
  editButton: {
    backgroundColor: '#fef3c7',
  },
  addButton: {
    backgroundColor: '#d1fae5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  instructionsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginTop: 0,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  modalCategory: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  modalCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  questionsList: {
    padding: 16,
  },
  emptyQuestionList: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyQuestionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  emptyQuestionSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  addQuestionButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addQuestionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  questionTypeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionTypeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCategory: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  questionMarks: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addMoreButton: {
    backgroundColor: '#7c3aed',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuestionBankScreen;