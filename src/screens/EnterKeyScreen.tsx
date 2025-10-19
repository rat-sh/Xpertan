import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet,
} from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { Exams, Exam, Mode } from '../types';

interface EnterKeyScreenProps {
  exams: Exams;
  onLoadExam: (exam: Exam) => void;
  onNavigate: (mode: Mode) => void;
}

const EnterKeyScreen: React.FC<EnterKeyScreenProps> = ({ 
  exams, 
  onLoadExam, 
  onNavigate 
}) => {
  const [examKey, setExamKey] = useState<string>('');

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

    onLoadExam(exam);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Enter Exam Key</Text>
      </View>

      <View style={styles.centerContent}>
        <Text style={commonStyles.label}>Exam Key</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Enter 6-digit key"
          value={examKey}
          onChangeText={setExamKey}
          autoCapitalize="characters"
          maxLength={6}
        />

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.primaryButton]}
          onPress={loadExam}
        >
          <Text style={commonStyles.buttonText}>Start Exam</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.secondaryButton]}
          onPress={() => onNavigate('home')}
        >
          <Text style={commonStyles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default EnterKeyScreen;