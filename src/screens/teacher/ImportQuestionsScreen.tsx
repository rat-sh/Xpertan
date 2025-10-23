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
import { commonStyles } from '../../styles/commonStyles';
import { Question } from '../../types';
import { parseQuestionsFromText, convertToQuestions } from '../../utils/questionParser';

interface ImportQuestionsScreenProps {
  onImport: (questions: Question[]) => void;
  onBack: () => void;
}

const ImportQuestionsScreen: React.FC<ImportQuestionsScreenProps> = ({ 
  onImport, 
  onBack 
}) => {
  const [textInput, setTextInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);

  const handleParse = () => {
    if (!textInput.trim()) {
      Alert.alert('Error', 'Please paste question text');
      return;
    }

    try {
      const parsed = parseQuestionsFromText(textInput);
      const questions = convertToQuestions(parsed);
      
      if (questions.length === 0) {
        Alert.alert('No Questions Found', 'Could not parse any questions from the text. Please check the format.');
        return;
      }

      setParsedQuestions(questions);
      Alert.alert('Success', `Parsed ${questions.length} questions! Review and import.`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert('Error', 'Failed to parse questions. Please check the format.');
    }
  };

  const handleImport = () => {
    if (parsedQuestions.length === 0) {
      Alert.alert('Error', 'No questions to import');
      return;
    }

    onImport(parsedQuestions);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Import Questions</Text>
        <Text style={commonStyles.headerSubtitle}>
          AI-Powered Text Parser
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <Text style={styles.helpText}>
            📝 Paste your questions in any of these formats:
          </Text>
          
          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>Format Example:</Text>
            <Text style={styles.exampleText}>
              Q1. What is 2+2?{'\n'}
              a) 3{'\n'}
              b) 4{'\n'}
              c) 5{'\n'}
              d) 6{'\n'}
              Answer: b{'\n'}
              Category: Numerical Ability
            </Text>
          </View>

          <Text style={commonStyles.label}>Paste Questions Here</Text>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            placeholder="Paste your questions here..."
            value={textInput}
            onChangeText={setTextInput}
            multiline
            numberOfLines={15}
          />

          <TouchableOpacity 
            style={[commonStyles.button, styles.parseButton]}
            onPress={handleParse}
          >
            <Text style={commonStyles.buttonText}>🤖 Parse with AI</Text>
          </TouchableOpacity>

          {parsedQuestions.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>
                ✅ Parsed {parsedQuestions.length} Questions
              </Text>
              
              {parsedQuestions.slice(0, 3).map((q, idx) => (
                <View key={idx} style={styles.questionPreview}>
                  <Text style={styles.previewQuestion}>
                    {idx + 1}. {q.question.substring(0, 60)}...
                  </Text>
                  <Text style={styles.previewCategory}>{q.category}</Text>
                  <Text style={styles.previewType}>Type: {q.type}</Text>
                </View>
              ))}

              {parsedQuestions.length > 3 && (
                <Text style={styles.moreText}>
                  ...and {parsedQuestions.length - 3} more questions
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={commonStyles.footer}>
        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.secondaryButton, commonStyles.footerButtonLeft]}
          onPress={onBack}
        >
          <Text style={commonStyles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.primaryButton, commonStyles.footerButtonRight]}
          onPress={handleImport}
          disabled={parsedQuestions.length === 0}
        >
          <Text style={commonStyles.buttonText}>Import Questions</Text>
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
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  parseButton: {
    backgroundColor: '#10b981',
    marginTop: 16,
  },
  previewSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 12,
  },
  questionPreview: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 8,
  },
  previewQuestion: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '600',
  },
  previewType: {
    fontSize: 11,
    color: '#6b7280',
  },
  moreText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ImportQuestionsScreen;