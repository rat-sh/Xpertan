// src/screens/SplashScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  ActivityIndicator,
  StatusBar,
  Easing,
} from 'react-native';

// Define UserRole type if not already defined
export type UserRole = 'teacher' | 'student';

interface SplashScreenProps {
  onRoleSelect: (role: UserRole) => void;
  isCheckingAuth: boolean;
  isOffline?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
   
  onRoleSelect, 
  isCheckingAuth, 
  isOffline = false 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

 useEffect(() => {
  const timer = setTimeout(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600, // faster fade-in
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5, // slightly tighter spring
        tension: 80, // more responsive
        useNativeDriver: true,
      }),
    ]).start();
  }, 30); // almost instant, but avoids black flash

  return () => clearTimeout(timer);
}, [fadeAnim, scaleAnim]);


  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineIcon}>📡</Text>
          <Text style={styles.offlineText}>No Internet Connection</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>📚</Text>
          <Text style={styles.appTitle}>Aptitude Exam</Text>
          <Text style={styles.appSubtitle}>ML-Powered Assessment Platform</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>I am a</Text>

          <TouchableOpacity
            style={[styles.roleButton, styles.teacherButton]}
            onPress={() => onRoleSelect('teacher')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>👨‍🏫</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>Teacher</Text>
              <Text style={styles.roleDescription}>
                Create exams, manage students & analyze performance
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, styles.studentButton]}
            onPress={() => onRoleSelect('student')}
            activeOpacity={0.8}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>👨‍🎓</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>Student</Text>
              <Text style={styles.roleDescription}>
                Take exams, track progress & improve skills
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by AI & Machine Learning
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  roleContainer: {
    marginBottom: 40,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  teacherButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  studentButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleIcon: {
    fontSize: 32,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
  },
});

export default SplashScreen;