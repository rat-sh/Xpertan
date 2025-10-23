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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { Mode, User } from '../../types';
import { supabase } from '../../config/supabase';

interface BatchManagementProps {
  onNavigate: (mode: Mode) => void;
  user: User;
}

interface Batch {
  id: string;
  name: string;
  teacher_id: string;
  teacher_name: string;
  student_count: number;
  created_at: string;
}

interface StudentInBatch {
  id: string;
  name: string;
  email: string;
  phone: string;
  parent_contact?: string;
}

const BatchManagement: React.FC<BatchManagementProps> = ({
  onNavigate,
  user,
}) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<StudentInBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<string | null>(null);
  const [editBatchName, setEditBatchName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

useEffect(() => {
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      console.error('Error loading batches:', error);
      Alert.alert('Error', 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  fetchBatches();
}, [user.id]); // only depends on user.id


  const loadStudentsInBatch = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, parent_contact')
        .eq('batch_id', batchId)
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      Alert.alert('Error', 'Please enter batch name');
      return;
    }

    setActionLoading(true);
    try {
      // Generate unique batch ID
      const batchId = `BATCH${Date.now().toString().slice(-6)}`;

      const { error } = await supabase
        .from('batches')
        .insert({
          id: batchId,
          name: batchName,
          teacher_id: user.id,
          teacher_name: user.name,
          student_count: 0,
        });

      if (error) throw error;

      Alert.alert(
        'Batch Created!',
        `Batch Name: ${batchName}\nBatch ID: ${batchId}\n\nShare this Batch ID with students during signup.`
      );

      setBatchName('');
      setShowCreateForm(false);
      loadBatches(); // Refresh list
    } catch (error: any) {
      console.error('Error creating batch:', error);
      Alert.alert('Error', error.message || 'Failed to create batch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBatch = async (batchId: string) => {
    if (!editBatchName.trim()) {
      Alert.alert('Error', 'Please enter batch name');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('batches')
        .update({ name: editBatchName })
        .eq('id', batchId)
        .eq('teacher_id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Batch name updated');
      setEditingBatch(null);
      setEditBatchName('');
      loadBatches(); // Refresh list
    } catch (error: any) {
      console.error('Error updating batch:', error);
      Alert.alert('Error', error.message || 'Failed to update batch');
    } finally {
      setActionLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    // First check if batch has students
    const { data: studentsData } = await supabase
      .from('users')
      .select('id')
      .eq('batch_id', batchId)
      .eq('role', 'student');

    if (studentsData && studentsData.length > 0) {
      Alert.alert(
        'Cannot Delete',
        `This batch has ${studentsData.length} student(s). Please remove students first or reassign them to another batch.`
      );
      return;
    }

    Alert.alert(
      'Delete Batch',
      `Are you sure you want to delete "${batchName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('batches')
                .delete()
                .eq('id', batchId)
                .eq('teacher_id', user.id);

              if (error) throw error;

              Alert.alert('Deleted', 'Batch removed successfully');
              loadBatches(); // Refresh list
            } catch (error: any) {
              console.error('Error deleting batch:', error);
              Alert.alert('Error', error.message || 'Failed to delete batch');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewStudents = async (batchId: string) => {
    setSelectedBatch(batchId);
    setShowStudentModal(true);
    await loadStudentsInBatch(batchId);
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    Alert.alert(
      'Remove Student',
      `Remove ${studentName} from this batch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('users')
                .update({ batch_id: null })
                .eq('id', studentId);

              if (error) throw error;

              Alert.alert('Success', `${studentName} removed from batch`);
              
              // Refresh student list
              if (selectedBatch) {
                await loadStudentsInBatch(selectedBatch);
              }
              // Refresh batch list to update student count
              await loadBatches();
            } catch (error: any) {
              console.error('Error removing student:', error);
              Alert.alert('Error', error.message || 'Failed to remove student');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getTotalStudents = () => {
    return batches.reduce((sum, batch) => sum + batch.student_count, 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading batches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Batch Management</Text>
        <Text style={commonStyles.headerSubtitle}>
          Organize and manage student batches
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
            <Text style={styles.createButtonText}>➕ Create New Batch</Text>
          </TouchableOpacity>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create New Batch</Text>

            <Text style={commonStyles.label}>Batch Name</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g., Morning Batch A, Grade 10 Science"
              value={batchName}
              onChangeText={setBatchName}
              editable={!actionLoading}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[commonStyles.button, commonStyles.secondaryButton, styles.formButton]}
                onPress={() => {
                  setShowCreateForm(false);
                  setBatchName('');
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
                onPress={handleCreateBatch}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={commonStyles.buttonText}>Create Batch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.batchStatCard]}>
            <Text style={styles.statNumber}>{batches.length}</Text>
            <Text style={styles.statLabel}>Total Batches</Text>
          </View>
          <View style={[styles.statCard, styles.studentStatCard]}>
            <Text style={styles.statNumber}>{getTotalStudents()}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
        </View>

        {/* Batches List */}
        <View style={styles.batchesContainer}>
          <Text style={styles.sectionTitle}>Your Batches</Text>

          {batches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No batches created yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first batch to organize students
              </Text>
            </View>
          ) : (
            batches.map((batch) => {
              const isEditing = editingBatch === batch.id;

              return (
                <View key={batch.id} style={styles.batchCard}>
                  <View style={styles.batchHeader}>
                    <View style={styles.batchInfo}>
                      {isEditing ? (
                        <View style={styles.editContainer}>
                          <TextInput
                            style={styles.editInput}
                            value={editBatchName}
                            onChangeText={setEditBatchName}
                            placeholder="Enter new batch name"
                            editable={!actionLoading}
                          />
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => handleEditBatch(batch.id)}
                            disabled={actionLoading}
                          >
                            <Text style={styles.saveButtonText}>✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                              setEditingBatch(null);
                              setEditBatchName('');
                            }}
                            disabled={actionLoading}
                          >
                            <Text style={styles.cancelButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.batchName}>{batch.name}</Text>
                          <View style={styles.batchIdBadge}>
                            <Text style={styles.batchIdText}>{batch.id}</Text>
                          </View>
                        </>
                      )}
                    </View>
                    {!isEditing && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteBatch(batch.id, batch.name)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.batchStats}>
                    <View style={styles.batchStat}>
                      <Text style={styles.batchStatIcon}>👨‍🎓</Text>
                      <Text style={styles.batchStatText}>
                        {batch.student_count} Student{batch.student_count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={styles.batchDate}>
                      Created: {new Date(batch.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  {!isEditing && (
                    <View style={styles.batchActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.viewButton]}
                        onPress={() => handleViewStudents(batch.id)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.actionButtonText}>
                          👁️ View Students ({batch.student_count})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => {
                          setEditingBatch(batch.id);
                          setEditBatchName(batch.name);
                        }}
                        disabled={actionLoading}
                      >
                        <Text style={styles.actionButtonText}>✏️ Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={() => {
                          Alert.alert(
                            'Share Batch ID',
                            `Batch: ${batch.name}\nBatch ID: ${batch.id}\n\nShare this ID with students during signup.`,
                            [{ text: 'OK' }]
                          );
                        }}
                        disabled={actionLoading}
                      >
                        <Text style={styles.actionButtonText}>📤 Share ID</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>💡 How to Manage Batches</Text>
          <Text style={styles.instructionText}>
            • Create batches to organize students by class, subject, or timing
          </Text>
          <Text style={styles.instructionText}>
            • Share the Batch ID with students during signup
          </Text>
          <Text style={styles.instructionText}>
            • View and manage all students in each batch
          </Text>
          <Text style={styles.instructionText}>
            • Assign exams to specific batches
          </Text>
          <Text style={styles.instructionText}>
            • Track batch-wise performance analytics
          </Text>
        </View>
      </ScrollView>

      {/* Student List Modal */}
      <Modal
        visible={showStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Students in {selectedBatch && batches.find(b => b.id === selectedBatch)?.name}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStudentModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.studentList}>
              {students.length === 0 ? (
                <View style={styles.emptyStudentList}>
                  <Text style={styles.emptyStudentIcon}>🔭</Text>
                  <Text style={styles.emptyStudentText}>No students yet</Text>
                  <Text style={styles.emptyStudentSubtext}>
                    Students will appear here when they signup with this batch ID
                  </Text>
                </View>
              ) : (
                students.map((student, index) => (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentNumber}>{index + 1}</Text>
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentEmail}>{student.email}</Text>
                        <Text style={styles.studentPhone}>📱 {student.phone}</Text>
                        {student.parent_contact && (
                          <Text style={styles.studentParent}>
                            👨‍👩‍👦 Parent: {student.parent_contact}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeStudentButton}
                      onPress={() => handleRemoveStudent(student.id, student.name)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.removeStudentText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {students.length > 0 && (
              <View style={styles.modalFooter}>
                <Text style={styles.totalStudents}>
                  Total: {students.length} student(s)
                </Text>
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
          <Text style={commonStyles.buttonText}>← Back to Dashboard</Text>
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
  batchStatCard: {
    backgroundColor: '#ede9fe',
  },
  studentStatCard: {
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
  batchesContainer: {
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
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  batchIdBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  batchIdText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    marginLeft: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  batchStats: {
    marginBottom: 12,
  },
  batchStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchStatIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  batchStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  batchDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  batchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
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
  shareButton: {
    backgroundColor: '#d1fae5',
  },
  actionButtonText: {
    fontSize: 12,
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
  studentList: {
    padding: 20,
  },
  emptyStudentList: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStudentIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStudentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  emptyStudentSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  studentInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  studentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginRight: 12,
    marginTop: 2,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  studentParent: {
    fontSize: 11,
    color: '#9ca3af',
  },
  removeStudentButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeStudentText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  totalStudents: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});

export default BatchManagement;

function loadBatches() {
  throw new Error('Function not implemented.');
}
