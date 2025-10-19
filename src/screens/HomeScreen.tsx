import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { Mode } from '../types';

interface HomeScreenProps {
  onNavigate: (mode: Mode) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Aptitude Exam App</Text>
        <Text style={commonStyles.headerSubtitle}>ML-Based Assessment Platform</Text>
      </View>

      <View style={styles.homeButtons}>
        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.primaryButton]}
          onPress={() => onNavigate('create')}
        >
          <Text style={commonStyles.buttonText}>Create Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[commonStyles.button, commonStyles.secondaryButton]}
          onPress={() => onNavigate('answerSetup')}
        >
          <Text style={commonStyles.buttonText}>Answer Exam</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  homeButtons: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});

export default HomeScreen;