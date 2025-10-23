// src/components/CategoryChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { CategoryScores } from '../types';

interface CategoryChartProps {
  categoryScores: CategoryScores;
  title?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  categoryScores, 
  title = 'Category-wise Performance' 
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Padding on both sides

  // Get colors based on performance
  const getBarColor = (percentage: number): string => {
    if (percentage >= 80) return '#10b981'; // Green - Excellent
    if (percentage >= 60) return '#3b82f6'; // Blue - Good
    if (percentage >= 40) return '#f59e0b'; // Orange - Average
    return '#ef4444'; // Red - Needs Improvement
  };

  // Get performance label
  const getPerformanceLabel = (percentage: number): string => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Needs Work';
  };

  // Calculate statistics
  const categories = Object.entries(categoryScores);
  const totalCategories = categories.length;
  const averageScore = categories.reduce((sum, [_, data]) => {
    return sum + (data.correct / data.total) * 100;
  }, 0) / totalCategories;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.averageContainer}>
          <Text style={styles.averageLabel}>Overall Average</Text>
          <Text style={[styles.averageScore, { color: getBarColor(averageScore) }]}>
            {averageScore.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' } as ViewStyle]} />
          <Text style={styles.legendText}>≥80% Excellent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' } as ViewStyle]} />
          <Text style={styles.legendText}>≥60% Good</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' } as ViewStyle]} />
          <Text style={styles.legendText}>≥40% Average</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' } as ViewStyle]} />
          <Text style={styles.legendText}>&lt;40% Needs Work</Text>
        </View>
      </View>

      {/* Chart Bars */}
      <View style={styles.chartContainer}>
        {categories.map(([category, data], index) => {
          const percentage = (data.correct / data.total) * 100;
          const barWidth = (percentage / 100) * chartWidth;
          const barColor = getBarColor(percentage);
          const performanceLabel = getPerformanceLabel(percentage);

          return (
            <View key={index} style={styles.barSection}>
              {/* Category Name and Stats */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {category}
                </Text>
                <View style={styles.statsRow}>
                  <Text style={styles.scoreText}>
                    {data.correct}/{data.total}
                  </Text>
                  <View style={[styles.performanceBadge, { backgroundColor: barColor + '20' }]}>
                    <Text style={[styles.performanceText, { color: barColor }]}>
                      {performanceLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      width: Math.max(barWidth, 30), // Minimum width for visibility
                      backgroundColor: barColor 
                    }
                  ]}
                >
                  <Text style={styles.percentageText}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Time Spent (if available) */}
              {data.avgTimeSpent && (
                <Text style={styles.timeText}>
                  ⏱️ Avg: {Math.round(data.avgTimeSpent)}s per question
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {categories.filter(([_, data]) => (data.correct / data.total) * 100 >= 70).length}
          </Text>
          <Text style={styles.summaryLabel}>Strong Areas</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {categories.filter(([_, data]) => (data.correct / data.total) * 100 < 50).length}
          </Text>
          <Text style={styles.summaryLabel}>Need Focus</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalCategories}</Text>
          <Text style={styles.summaryLabel}>Total Categories</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  averageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  averageLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  averageScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  chartContainer: {
    marginBottom: 16,
  },
  barSection: {
    marginBottom: 20,
  },
  categoryHeader: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  barBackground: {
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  percentageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default CategoryChart;