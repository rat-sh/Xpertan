// src/screens/teacher/TeacherDashboard.tsx - DEV VERSION with DUMMY DATA
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { User, Mode } from '../../types';

// --- Interfaces ---
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
  students_attempted: number;
  average_score: number;
}

interface MyTask {
  id: string;
  text: string;
  done: boolean;
}

interface Misconception {
  id: string;
  topic: string;
  misconception: string;
  wrong_count: number;
}

interface RunningExamCountCardProps {
  count: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling
const scaleFont = (size: number) => (SCREEN_WIDTH / 375) * size;
const scaleSize = (size: number) => (SCREEN_WIDTH / 375) * size;

// --- DUMMY DATA FOR DEVELOPMENT ---
const DUMMY_EXAMS: ExamData[] = [
  {
    key: 'CHEM101',
    title: 'Organic Chemistry - Hydrocarbons & Functional Groups',
    questions: Array(25).fill({}),
    duration: 3600,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    students_attempted: 45,
    average_score: 78.5,
  },
  {
    key: 'MATH202',
    title: 'Calculus - Derivatives and Integration',
    questions: Array(30).fill({}),
    duration: 5400,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    students_attempted: 38,
    average_score: 82.3,
  },
  {
    key: 'PHYS301',
    title: 'Modern Physics - Quantum Mechanics Basics',
    questions: Array(20).fill({}),
    duration: 4800,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    students_attempted: 52,
    average_score: 71.8,
  },
  {
    key: 'BIO150',
    title: 'Cell Biology - Mitosis and Meiosis',
    questions: Array(35).fill({}),
    duration: 4200,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    students_attempted: 67,
    average_score: 85.2,
  },
  {
    key: 'ENG401',
    title: 'Shakespeare - Macbeth Analysis',
    questions: Array(15).fill({}),
    duration: 2700,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    students_attempted: 29,
    average_score: 76.9,
  },
];

const DUMMY_MISCONCEPTIONS: Misconception[] = [
  { id: 'm1', topic: 'Stoichiometry', misconception: 'Mixing up limiting and excess reactants', wrong_count: 85 },
  { id: 'm2', topic: 'World War II', misconception: 'Misidentifying the primary Axis powers', wrong_count: 62 },
  { id: 'm3', topic: 'Quadratic Equations', misconception: 'Incorrect application of the quadratic formula (sign error)', wrong_count: 51 },
  { id: 'm4', topic: 'Photosynthesis', misconception: 'Confusing light-dependent and light-independent reactions', wrong_count: 47 },
  { id: 'm5', topic: 'Newton\'s Laws', misconception: 'Misunderstanding action-reaction pairs', wrong_count: 43 },
];

const DUMMY_TASKS: MyTask[] = [
  { id: '1', text: 'Prepare lesson plan for Week 5', done: false },
  { id: '2', text: 'Grade Batch A midterms', done: true },
  { id: '3', text: 'Call parent for Student X', done: false },
  { id: '4', text: 'Update syllabus for next semester', done: false },
  { id: '5', text: 'Order lab equipment', done: true },
];

// --- Helper Icon Components ---
const CheckIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <View
    style={{
      width: scaleSize(12),
      height: scaleSize(7),
      borderBottomWidth: 2,
      borderLeftWidth: 2,
      borderColor: color,
      transform: [{ rotate: '-45deg' }],
      top: -scaleSize(1),
    }}
  />
);

const PlusIcon = ({ color = '#1a1a1a' }: { color?: string }) => (
  <View style={{ width: scaleSize(14), height: scaleSize(14), justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ position: 'absolute', width: scaleSize(14), height: 2, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ position: 'absolute', width: 2, height: scaleSize(14), backgroundColor: color, borderRadius: 1 }} />
  </View>
);

const MoreIcon = ({ color = '#8b8b8b' }: { color?: string }) => (
  <View style={{ flexDirection: 'row', gap: scaleSize(3) }}>
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
  </View>
);

const DeleteIcon = ({ color = '#dc2626' }: { color?: string }) => (
  <View style={{ width: scaleSize(14), height: scaleSize(14), justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        position: 'absolute',
        width: scaleSize(14),
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ rotate: '45deg' }],
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: scaleSize(14),
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

const ChevronRightIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <View
    style={{
      width: scaleSize(10),
      height: scaleSize(10),
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderColor: color,
      transform: [{ rotate: '45deg' }],
    }}
  />
);

// --- Doubts Board Component ---
interface MisconceptionCardProps {
  count: number;
  onPress: () => void;
}

const DoubtsSummaryCard: React.FC<MisconceptionCardProps> = ({ count, onPress }) => (
  <View style={[styles.section, { paddingBottom: scaleSize(10) }]}>
    <Text style={[styles.sectionTitle, { marginBottom: scaleSize(20) }]}>Doubts Board</Text>
    <TouchableOpacity style={styles.doubtsMinimalCard} onPress={onPress}>
      <Text style={styles.doubtsMinimalText}>
        Mistakes: <Text style={styles.doubtsMinimalCount}>{count}</Text>
      </Text>
      <ChevronRightIcon color="#1a1a1a" />
    </TouchableOpacity>
  </View>
);

// --- Running Exam Count Card ---
const RunningExamCountCard: React.FC<RunningExamCountCardProps> = ({ count }) => (
  <View style={[styles.section, { paddingTop: 0, paddingBottom: scaleSize(10) }]}>
    <TouchableOpacity
      style={styles.runningExamCard}
      onPress={() => Alert.alert('Running Exams', `You have ${count} exams currently active!`)}
    >
      <Text style={styles.runningExamText}>
        Exams Running: <Text style={styles.runningExamCount}>{count}</Text>
      </Text>
      <ChevronRightIcon color="#ffffff" />
    </TouchableOpacity>
  </View>
);

// --- Main Component ---
const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onNavigate, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  // State from dummy data
  const [recentExams, setRecentExams] = useState<ExamData[]>([]);
  const [myTasks, setMyTasks] = useState<MyTask[]>(DUMMY_TASKS);
  const [misconceptions, setMisconceptions] = useState<Misconception[]>(DUMMY_MISCONCEPTIONS);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const totalExamsCount = DUMMY_EXAMS.length;
  const misconceptionCount = misconceptions.length;

  const pendingTaskCount = useMemo(() => {
    return myTasks.filter((task) => !task.done).length;
  }, [myTasks]);

  const sortedTasks = useMemo(() => {
    return [...myTasks].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  }, [myTasks]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setRecentExams(DUMMY_EXAMS.slice(0, 5));
      setLoading(false);
    }, 1000);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(timer);
  }, [fadeAnim]);

  const handleAddTask = () => {
    const trimmedText = newTaskText.trim();
    if (trimmedText.length === 0) {
      Alert.alert('Error', 'Task description cannot be empty.');
      return;
    }

    const newTask: MyTask = {
      id: Date.now().toString(),
      text: trimmedText,
      done: false,
    };

    setMyTasks([newTask, ...myTasks]);
    setNewTaskText('');
    setModalVisible(false);
  };

  const handleToggleTask = (id: string) => {
    setMyTasks(myTasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const handleDeleteTask = (id: string) => {
    setMyTasks(myTasks.filter((task) => task.id !== id));
  };

  const handleViewMisconceptions = () => {
    const misconceptionList = misconceptions
      .map((m, i) => `${i + 1}. ${m.topic}: ${m.misconception} (${m.wrong_count} students)`)
      .join('\n\n');
    
    Alert.alert('Common Misconceptions', misconceptionList);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Add Task Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Prepare lesson plan..."
              placeholderTextColor="#8b8b8b"
              value={newTaskText}
              onChangeText={setNewTaskText}
              autoFocus={true}
              maxLength={200}
              onSubmitEditing={handleAddTask}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewTaskText('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleAddTask}>
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header - Glassmorphic */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user.name}</Text>
            <Text style={styles.role}>Admin Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* To Do Lists */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                To Do Lists
                <Text style={styles.pendingCountText}> ({pendingTaskCount} Left)</Text>
              </Text>
              <TouchableOpacity style={styles.addTaskButton} onPress={() => setModalVisible(true)}>
                <PlusIcon color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <View style={styles.todoContainer}>
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task, index) => (
                  <View
                    key={task.id}
                    style={[styles.todoItem, index === sortedTasks.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <TouchableOpacity style={styles.todoToggleArea} onPress={() => handleToggleTask(task.id)}>
                      <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
                        {task.done && <CheckIcon />}
                      </View>
                      <Text style={[styles.todoText, task.done && styles.todoTextDone]}>{task.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(task.id)}>
                      <DeleteIcon />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.todoEmptyText}>No tasks added yet. Tap the '+' to add one.</Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: scaleSize(20) }]}>Quick Actions</Text>

            <View style={styles.actionsVerticalContainer}>
              <TouchableOpacity style={styles.actionCardVertical} onPress={() => onNavigate('create')}>
                <View style={styles.actionLeft}>
                  <PlusIcon color="#d4af37" />
                  <Text style={[styles.actionTitleVertical, { color: '#d4af37' }]}>Create New Exam</Text>
                </View>
                <ChevronRightIcon color="#d4af37" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCardVertical}
                onPress={() => Alert.alert('Coming Soon', 'Previous Questions/Past Papers management is next!')}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.placeholderIcon, { backgroundColor: 'rgba(212, 175, 55, 0.4)' }]} />
                  <Text style={styles.actionTitleVertical}>Check Past Papers</Text>
                </View>
                <ChevronRightIcon color="#1a1a1a" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCardVertical}
                onPress={() => Alert.alert('Coming Soon', 'Question Bank management is next!')}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.placeholderIcon, { backgroundColor: 'rgba(212, 175, 55, 0.4)' }]} />
                  <Text style={styles.actionTitleVertical}>Question Bank</Text>
                </View>
                <ChevronRightIcon color="#1a1a1a" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCardVertical}
                onPress={() => Alert.alert('Coming Soon', 'Batch management feature is next!')}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.placeholderIcon, { backgroundColor: 'rgba(212, 175, 55, 0.4)' }]} />
                  <Text style={styles.actionTitleVertical}>Manage Student Batches</Text>
                </View>
                <ChevronRightIcon color="#1a1a1a" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Exams Running Count */}
          <RunningExamCountCard count={totalExamsCount} />

          {/* Doubts Board */}
          <DoubtsSummaryCard count={misconceptionCount} onPress={handleViewMisconceptions} />

          {/* Recently Running Exams */}
          {recentExams.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Running Exams</Text>
                <TouchableOpacity onPress={() => Alert.alert('All Exams', `Total: ${totalExamsCount} exams`)}>
                  <Text style={styles.sectionLink}>View All</Text>
                </TouchableOpacity>
              </View>

              {recentExams.map((exam, index) => (
                <View key={exam.key} style={styles.examCard}>
                  <View style={styles.examHeader}>
                    <View style={styles.examTitleRow}>
                      <Text style={styles.examTitle} numberOfLines={2}>
                        {exam.title}
                      </Text>
                      <View style={styles.examKeyBadge}>
                        <Text style={styles.examKeyText}>{exam.key}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.examMoreButton}
                      onPress={() => Alert.alert('Options', 'View Details\nDownload PDF\nShare Exam\nDelete')}
                    >
                      <MoreIcon />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.examStats}>
                    <View style={styles.examStat}>
                      <Text style={styles.examStatLabel}>Questions</Text>
                      <Text style={styles.examStatValue}>{exam.questions.length}</Text>
                    </View>
                    <View style={styles.examStatDivider} />
                    <View style={styles.examStat}>
                      <Text style={styles.examStatLabel}>Duration</Text>
                      <Text style={styles.examStatValue}>{Math.floor(exam.duration / 60)}m</Text>
                    </View>
                    <View style={styles.examStatDivider} />
                    <View style={styles.examStat}>
                      <Text style={styles.examStatLabel}>Attempted</Text>
                      <Text style={styles.examStatValue}>{exam.students_attempted}</Text>
                    </View>
                    <View style={styles.examStatDivider} />
                    <View style={styles.examStat}>
                      <Text style={styles.examStatLabel}>Avg Score</Text>
                      <Text style={styles.examStatValue}>{exam.average_score.toFixed(1)}%</Text>
                    </View>
                  </View>

                  <View style={styles.examActions}>
                    <TouchableOpacity
                      style={styles.examActionButton}
                      onPress={() => Alert.alert('View Exam', `Opening ${exam.key}...`)}
                    >
                      <Text style={styles.examActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.examActionButton}
                      onPress={() => Alert.alert('Edit Exam', `Editing ${exam.key}...`)}
                    >
                      <Text style={styles.examActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.examActionButton}
                      onPress={() => Alert.alert('Share Exam', `Sharing ${exam.key}...`)}
                    >
                      <Text style={styles.examActionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox} />
                <Text style={styles.emptyTitle}>No Exams Running Yet</Text>
                <Text style={styles.emptySubtitle}>Create your first exam to get started</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => onNavigate('create')}>
                  <Text style={styles.emptyButtonText}>Create Exam</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: scaleSize(16),
    fontSize: scaleFont(14),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.5),
  },

  // Header - Glassmorphic
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingVertical: SCREEN_HEIGHT * 0.025,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: scaleFont(22),
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: scaleSize(0.5),
    marginBottom: scaleSize(4),
  },
  role: {
    fontSize: scaleFont(13),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.5),
  },
  logoutButton: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoutText: {
    color: '#1a1a1a',
    fontWeight: '500',
    fontSize: scaleFont(13),
    letterSpacing: scaleSize(0.3),
  },

  scrollView: {
    flex: 1,
  },

  // Section
  section: {
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingTop: SCREEN_HEIGHT * 0.03,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSize(12),
  },
  sectionTitle: {
    fontSize: scaleFont(18),
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: scaleSize(0.5),
  },
  sectionLink: {
    fontSize: scaleFont(13),
    color: '#d4af37',
    letterSpacing: scaleSize(0.3),
  },

  // To Do Lists - Glassmorphic
  pendingCountText: {
    fontSize: scaleFont(14),
    fontWeight: '500',
    color: '#dc2626',
  },
  addTaskButton: {
    width: scaleSize(32),
    height: scaleSize(32),
    borderRadius: scaleSize(16),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scaleSize(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  todoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: scaleSize(16),
    paddingVertical: scaleSize(4),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  todoToggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: scaleSize(22),
    height: scaleSize(22),
    borderRadius: scaleSize(6),
    borderWidth: 2,
    borderColor: '#d4af37',
    marginRight: scaleSize(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxDone: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  todoText: {
    fontSize: scaleFont(14),
    color: '#1a1a1a',
    flex: 1,
  },
  todoTextDone: {
    color: '#8b8b8b',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: scaleSize(8),
  },
  todoEmptyText: {
    fontSize: scaleFont(13),
    color: '#8b8b8b',
    textAlign: 'center',
    padding: scaleSize(16),
  },

  // Running Exam Card - Glassmorphic Gold
  runningExamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
    borderRadius: scaleSize(16),
    padding: scaleSize(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    marginTop: scaleSize(20),
  },
  runningExamText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: '#ffffff',
  },
  runningExamCount: {
    color: '#1a1a1a',
    fontWeight: '800',
  },

  // Doubts Board - Glassmorphic
  doubtsMinimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: scaleSize(16),
    padding: scaleSize(18),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
    marginBottom: scaleSize(20),
  },
  doubtsMinimalText: {
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: '#1a1a1a',
  },
  doubtsMinimalCount: {
    color: '#d4af37',
    fontWeight: '800',
  },

  // Quick Actions - Glassmorphic
  actionsVerticalContainer: {
    gap: scaleSize(16),
    marginBottom: scaleSize(16),
  },
  actionCardVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: scaleSize(18),
    borderRadius: scaleSize(16),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitleVertical: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: scaleSize(0.3),
    marginLeft: scaleSize(12),
  },
  placeholderIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    borderRadius: scaleSize(4),
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
  },

  // Exam Card - Glassmorphic
  examCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: scaleSize(16),
    padding: scaleSize(16),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
    marginBottom: scaleSize(12),
  },
  examHeader: {
    marginBottom: scaleSize(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examTitleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examTitle: {
    flex: 1,
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: scaleSize(0.3),
    marginRight: scaleSize(12),
  },
  examKeyBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  examKeyText: {
    color: '#d4af37',
    fontSize: scaleFont(12),
    fontWeight: '600',
    letterSpacing: scaleSize(0.5),
  },
  examMoreButton: {
    padding: scaleSize(8),
    marginLeft: scaleSize(8),
  },
  examStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(16),
    paddingVertical: scaleSize(12),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  examStat: {
    flex: 1,
    alignItems: 'center',
  },
  examStatLabel: {
    fontSize: scaleFont(11),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.3),
    marginBottom: scaleSize(4),
  },
  examStatValue: {
    fontSize: scaleFont(15),
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: scaleSize(0.3),
  },
  examStatDivider: {
    width: 1,
    height: scaleSize(32),
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  examActions: {
    flexDirection: 'row',
    gap: scaleSize(8),
  },
  examActionButton: {
    flex: 1,
    paddingVertical: scaleSize(10),
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
  },
  examActionText: {
    fontSize: scaleFont(13),
    fontWeight: '500',
    color: '#d4af37',
    letterSpacing: scaleSize(0.3),
  },

  // Empty State - Glassmorphic
  emptyState: {
    alignItems: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.08,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: scaleSize(16),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyIconBox: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(20),
  },
  emptyTitle: {
    fontSize: scaleFont(18),
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: scaleSize(0.3),
    marginBottom: scaleSize(8),
  },
  emptySubtitle: {
    fontSize: scaleFont(14),
    color: '#8b8b8b',
    textAlign: 'center',
    letterSpacing: scaleSize(0.3),
    marginBottom: scaleSize(24),
  },
  emptyButton: {
    paddingHorizontal: scaleSize(24),
    paddingVertical: scaleSize(12),
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: scaleSize(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: scaleFont(14),
    fontWeight: '500',
    letterSpacing: scaleSize(0.5),
  },

  // Modal - Glassmorphic
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(24),
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: scaleSize(16),
    padding: scaleSize(24),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: scaleFont(18),
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: scaleSize(16),
  },
  modalInput: {
    backgroundColor: 'rgba(250, 250, 250, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: scaleSize(8),
    padding: scaleSize(12),
    fontSize: scaleFont(14),
    color: '#1a1a1a',
    marginBottom: scaleSize(24),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scaleSize(12),
  },
  modalButton: {
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(20),
    borderRadius: scaleSize(8),
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(238, 238, 238, 0.8)',
  },
  modalButtonTextCancel: {
    color: '#1a1a1a',
    fontWeight: '500',
    fontSize: scaleFont(14),
  },
  modalButtonSave: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  modalButtonTextSave: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: scaleFont(14),
  },

  bottomSpacing: {
    height: SCREEN_HEIGHT * 0.03,
  },
});

export default TeacherDashboard;