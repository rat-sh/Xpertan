import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CategoryScores } from '../types';

interface PerformanceChartProps {
  categoryScores: CategoryScores;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ categoryScores }) => {
  const maxScore = 100;
  const chartWidth = Dimensions.get('window').width - 40;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Analysis</Text>
      
      {Object.entries(categoryScores).map(([category, data], index) => {
        const percentage = (data.correct / data.total) * 100;
        const barWidth = (percentage / maxScore) * chartWidth;
        const barColor = percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

        return (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.categoryLabel}>{category}</Text>
            <View style={styles.barWrapper}>
              <View style={[styles.bar, { width: barWidth, backgroundColor: barColor }]}>
                <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
              </View>
            </View>
            <Text style={styles.scoreText}>{data.correct}/{data.total}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  barContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  barWrapper: {
    height: 32,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bar: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 12,
    borderRadius: 16,
  },
  percentageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default PerformanceChart;
