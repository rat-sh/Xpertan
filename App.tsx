import React, { useState } from 'react';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);

import HomeScreen from './src/screens/HomeScreen';
import CreateExamScreen from './src/screens/CreateExamScreen';
import EnterKeyScreen from './src/screens/EnterKeyScreen';
import TakeExamScreen from './src/screens/TakeExamScreen';
import ResultsScreen from './src/screens/ResultsScreen';

import { Mode, Exams, Exam, Answers } from './src/types';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('home');
  const [exams, setExams] = useState<Exams>({});
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examAnswers, setExamAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleNavigate = (newMode: Mode) => {
    setMode(newMode);
  };

  const handleSaveExam = (updatedExams: Exams) => {
    setExams(updatedExams);
  };

  const handleLoadExam = (exam: Exam) => {
    setCurrentExam(exam);
    setExamAnswers({});
    setShowResults(false);
    setMode('answer');
  };

  const handleSubmitExam = (answers: Answers) => {
    setExamAnswers(answers);
    setShowResults(true);
  };

  const handleBackToHome = () => {
    setCurrentExam(null);
    setExamAnswers({});
    setShowResults(false);
    setMode('home');
  };

  // Render appropriate screen based on mode
  if (mode === 'home') {
    return <HomeScreen onNavigate={handleNavigate} />;
  }

  if (mode === 'create') {
    return (
      <CreateExamScreen 
        exams={exams}
        onSaveExam={handleSaveExam}
        onNavigate={handleNavigate}
      />
    );
  }

  if (mode === 'answerSetup') {
    return (
      <EnterKeyScreen 
        exams={exams}
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
        onNavigate={handleBackToHome}
      />
    );
  }

  return null;
};

export default App;