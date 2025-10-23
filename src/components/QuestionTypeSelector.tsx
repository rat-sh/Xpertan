import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QuestionType } from '../types';

interface QuestionTypeSelectorProps {
  selectedType: QuestionType;
  onSelect: (type: QuestionType) => void;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ 
  selectedType, 
  onSelect 
}) => {
  const types: { value: QuestionType; label: string; icon: string }[] = [
    { value: 'single', label: 'Single Choice', icon: '⭕' },
    { value: 'multiple', label: 'Multiple Choice', icon: '☑️' },
    { value: 'boolean', label: 'True/False', icon: '✓✗' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Question Type</Text>
      <View style={styles.optionsContainer}>
        {types.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeButton,
              selectedType === type.value && styles.selectedType
            ]}
            onPress={() => onSelect(type.value)}
          >
            <Text style={styles.icon}>{type.icon}</Text>
            <Text style={[
              styles.typeLabel,
              selectedType === type.value && styles.selectedTypeLabel
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  selectedType: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  selectedTypeLabel: {
    color: '#7c3aed',
  },
});

export default QuestionTypeSelector;