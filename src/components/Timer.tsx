import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  paused?: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, paused = false }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpRef = React.useRef(onTimeUp);

  // Keep onTimeUp ref up to date
  React.useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - invoke callback and stop
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paused]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    const percentLeft = (timeLeft / duration) * 100;
    if (percentLeft > 50) return '#10b981'; // green
    if (percentLeft > 25) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <View style={[styles.timerContainer, { backgroundColor: getTimerColor() }]}>
      <Text style={styles.timerText}>⏱️ {formatTime(timeLeft)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default Timer;
