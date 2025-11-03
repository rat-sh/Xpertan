// App.tsx - Corrected Version with Supabase Integration
console.log('=== APP.TSX STARTING ===');
import React, { useState, useEffect } from 'react';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);

console.log('About to import SplashScreen...');
import SplashScreen from './src/screens/SplashScreen';
console.log('About to import loginscreen...');
import LoginScreen from './src/screens/auth/LoginScreen';
console.log('About to import SignupScreen...');
import SignUpScreen from './src/screens/auth/SignUpScreen';
import { StudentDashboard } from './src/screens/student/StudentDashboard';
import TeacherDashboard from './src/screens/teacher/TeacherDashboard';
import CreateExamScreen from './src/screens/teacher/CreateExamScreen';
import EnterKeyScreen from './src/screens/student/EnterKeyScreen';
import TakeExamScreen from './src/screens/student/TakeExamScreen';
import ResultsScreen from './src/screens/student/ResultsScreen';
import { Mode, Exam, Answers, User, UserRole } from './src/types';
console.log('About to import Supabase...');
import { supabase } from './src/config/supabase';
console.log('Supabase imported successfully!');
import { calculateResults } from './src/utils/helpers';
import { transformUserFromDB, transformExamAttemptToDB } from './src/utils/transformers';
import { supabaseQuery, getNetworkErrorMessage, checkConnectivity } from './src/utils/networkUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import ForgotPinScreen from './src/screens/auth/ForgotPinScreen';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examAnswers, setExamAnswers] = useState<Answers>({});
  const [questionTimes, setQuestionTimes] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
/*
  const checkUserSession = React.useCallback(async () => {
    try {
      // Check connectivity before attempting network operations
      const isConnected = await checkConnectivity();
      
      if (!isConnected) {
        setIsOffline(true);
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [
            { text: 'OK', onPress: () => setMode('splash') }
          ]
        );
        setIsCheckingAuth(false);
        return;
      }
      
      // We're online now
      setIsOffline(false);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile from database with retry
        const profileResult = await supabaseQuery(
          async () => {
            const result = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            return result;
          },
          'Fetch User Profile'
        );

        if (profileResult.data && !profileResult.error) {
          const userData = transformUserFromDB(profileResult.data);
          setUser(userData);
          setSelectedRole(userData.role);
          setMode('dashboard');
        } else {
          setMode('splash');
        }
      } else {
        setMode('splash');
      }
    } catch (error: any) {
      console.error('Error checking session:', error);
      const errorMessage = getNetworkErrorMessage(error);
      
      // Show user-facing error with retry option
      Alert.alert(
        'Connection Error',
        `${errorMessage}\n\nWould you like to retry?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => checkUserSession() },
        ]
      );
      
      setMode('splash');
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);
*/
// This is for development purpose
useEffect(() => {
  setIsCheckingAuth(false);
  setMode('dashboard');
  
  const testUser: User = {
    id: 'test-teacher-id',
    name: 'Test Teacher',
    email: 'teacher@test.com',
    phone: '1234567890',
    role: 'teacher',
  };
  
  setUser(testUser);
  setSelectedRole('teacher');
}, []);

// upper is short cut for bypass

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setMode('login');
  };

  const handleNavigate = (newMode: Mode) => {
    // Clear exam data when navigating away from exam flow
    if (newMode === 'dashboard') {
      setCurrentExam(null);
      setExamAnswers({});
      setQuestionTimes({});
      setShowResults(false);
    }
    setMode(newMode);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setMode('dashboard');
  };

  const handleSignUp = (userData: User) => {
    setUser(userData);
    setMode('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSelectedRole(null);
    setCurrentExam(null);
    setExamAnswers({});
    setQuestionTimes({});
    setShowResults(false);
    setMode('splash');
  };

  const handleLoadExam = (exam: Exam) => {
    setCurrentExam(exam);
    setExamAnswers({});
    setQuestionTimes({});
    setShowResults(false);
    setMode('answer');
  };

  const handleSubmitExam = async (answers: Answers, times: { [key: number]: number }) => {
    setExamAnswers(answers);
    setQuestionTimes(times);
    setShowResults(true);

    // Save exam attempt to Supabase with error handling and retry
    if (currentExam && user) {
      const results = calculateResults(currentExam, answers);
      
      // Use transformer to build the payload with consistent field naming
      const attemptData = transformExamAttemptToDB(
        {
          studentId: user.id,
          answers,
          questionTimes: times,
          score: results.score,
          completedAt: new Date().toISOString(),
        },
        currentExam.key,
        results.totalMarks
      );

      try {
        // Attempt to save with retry logic
        await supabaseQuery(
          async () => {
            const result = await supabase
              .from('exam_attempts')
              .insert(attemptData);
            return result;
          },
          'Save Exam Attempt',
          { maxRetries: 2, timeout: 15000 }
        );
      } catch (error: any) {
        console.error('Error saving exam attempt:', error);
        const errorMessage = getNetworkErrorMessage(error);
        
        // Cache attempt locally for later sync
        try {
          const pendingAttempts = await AsyncStorage.getItem('pendingExamAttempts');
          const attempts = pendingAttempts ? JSON.parse(pendingAttempts) : [];
          attempts.push({
            ...attemptData,
            timestamp: Date.now(),
          });
          await AsyncStorage.setItem('pendingExamAttempts', JSON.stringify(attempts));
        } catch (cacheError) {
          console.error('Error caching exam attempt:', cacheError);
        }

        // Show user-facing error with retry option
        Alert.alert(
          'Unable to Save Results',
          `${errorMessage}\n\nYour results have been saved locally and will be synced when you're back online.\n\nWould you like to retry now?`,
          [
            { 
              text: 'View Results', 
              style: 'cancel',
              onPress: () => {
                // Results are already shown, just dismiss
              }
            },
            { 
              text: 'Retry', 
              onPress: async () => {
                try {
                  await supabaseQuery(
                    async () => {
                      const result = await supabase
                        .from('exam_attempts')
                        .insert(attemptData);
                      return result;
                    },
                    'Retry Save Exam Attempt',
                    { maxRetries: 1, timeout: 15000 }
                  );
                  Alert.alert('Success', 'Results saved successfully!');
                } catch {
                  Alert.alert(
                    'Still Unable to Save',
                    'Your results remain saved locally and will sync automatically later.'
                  );
                }
              }
            },
          ]
        );
      }
    }
  };

  // Splash Screen
  if (mode === 'splash') {
    return (
      <SplashScreen
        onRoleSelect={handleRoleSelect}
        isCheckingAuth={isCheckingAuth}
        isOffline={isOffline}
      />
    );
  }

  // Authentication screens
  if (mode === 'login' && selectedRole) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onNavigate={handleNavigate}
        selectedRole={selectedRole}
        onBack={() => {
          setSelectedRole(null);
          setMode('splash');
        }}
      />
    );
  }

  if (mode === 'signup') {
    return (
      <SignUpScreen
        onSignUp={handleSignUp}
        onNavigate={handleNavigate}
      />
    );
  }

  // Forgot PIN screen
  if (mode === 'forgotPin') {
    return (
      <ForgotPinScreen
        onNavigate={handleNavigate}
        onBack={() => {
          setMode('login');
        }}
      />
    );
  }

  // Dashboard screens
  if (mode === 'dashboard' && user) {
    if (user.role === 'teacher') {
      return (
        <TeacherDashboard
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      );
    } else {
      return (
        <StudentDashboard
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      );
    }
  }

  // Teacher screens
  if (mode === 'create' && user?.role === 'teacher') {
    return (
      <CreateExamScreen
        user={user}
        onNavigate={handleNavigate}
      />
    );
  }

  // Student screens
  if (mode === 'answerSetup') {
    return (
      <EnterKeyScreen
        onLoadExam={handleLoadExam}
        onNavigate={handleNavigate}
      />
    );
  }

  if (mode === 'answer' && currentExam && !showResults) {
    return (
      <TakeExamScreen
        exam={currentExam}
        onSubmit={handleSubmitExam}
      />
    );
  }

  if (mode === 'answer' && currentExam && showResults) {
    return (
      <ResultsScreen
        exam={currentExam}
        answers={examAnswers}
        questionTimes={questionTimes}
        onNavigate={handleNavigate}
      />
    );
  }

  // Fallback
  return (
    <SplashScreen
      onRoleSelect={handleRoleSelect}
      isCheckingAuth={false}
      isOffline={isOffline}
    />
  );
};

export default App;
