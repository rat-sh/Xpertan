// src/screens/SplashScreen.tsx - PORTFOLIO-MATCHED + RESPONSIVE
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
  Easing,
  Dimensions,
} from 'react-native';

export type UserRole = 'teacher' | 'student';

interface SplashScreenProps {
  onRoleSelect: (role: UserRole) => void;
  isCheckingAuth: boolean;
  isOffline?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling functions
const scaleFont = (size: number) => (SCREEN_WIDTH / 375) * size;
const scaleSize = (size: number) => (SCREEN_WIDTH / 375) * size;

const SplashScreen: React.FC<SplashScreenProps> = ({
  onRoleSelect,
  isCheckingAuth,
  isOffline = false
}) => {
  // Initialize all hooks at the top (unconditionally)
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleTeacher] = useState(new Animated.Value(1));
  const [scaleStudent] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!isCheckingAuth) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, slideAnim, isCheckingAuth]);

  const handlePressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />
      
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>No Internet Connection</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>XPERTAN</Text>
          <Text style={styles.tagline}>Excellence in Assessment</Text>
        </View>


        {/* Main Card Container */}
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Select Your Role</Text>
          
          {/* Role Cards - Horizontal Row */}
          <View style={styles.rolesContainer}>
            {/* Admin Card */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => handlePressIn(scaleTeacher)}
              onPressOut={() => handlePressOut(scaleTeacher)}
              onPress={() => onRoleSelect('teacher')}
              style={styles.roleCardWrapper}
            >
              <Animated.View
                style={[
                  styles.roleCard,
                  { transform: [{ scale: scaleTeacher }] }
                ]}
              >
                <Text style={styles.roleTitle}>Admin</Text>
              </Animated.View>
            </TouchableOpacity>

            {/* Student Card */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => handlePressIn(scaleStudent)}
              onPressOut={() => handlePressOut(scaleStudent)}
              onPress={() => onRoleSelect('student')}
              style={styles.roleCardWrapper}
            >
              <Animated.View
                style={[
                  styles.roleCard,
                  { transform: [{ scale: scaleStudent }] }
                ]}
              >
                <Text style={styles.roleTitle}>Student</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.inspirationalQuote}>
            Your mind is the path, your effort the flame,{'\n'}your progress the light
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                // Open LinkedIn - Add: Linking.openURL('https://linkedin.com/in/yourprofile');
                console.log('Opening LinkedIn...');
              }}
            >
              <Text style={styles.footerLink}>Rathi</Text>
            </TouchableOpacity>
            
            <Text style={styles.footerSeparator}>|</Text>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                // Open GitHub - Add: Linking.openURL('https://github.com/yourusername');
                console.log('Opening GitHub...');
              }}
            >
              <Text style={styles.footerLink}>Git</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: SCREEN_HEIGHT * 0.06, // 6% of screen height
    paddingHorizontal: SCREEN_WIDTH * 0.06, // 6% of screen width
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFont(16),
    color: '#d4af37',
    fontWeight: '500',
    letterSpacing: 1,
  },

  // Offline Banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: SCREEN_HEIGHT * 0.015,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
  },
  offlineDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: '#EF4444',
    marginRight: scaleSize(8),
  },
  offlineText: {
    fontSize: scaleFont(12),
    color: '#EF4444',
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Header - 20% of vertical space
  header: {
    alignItems: 'center',
    flex: 0.2,
    justifyContent: 'center',
  },
  logo: {
    fontSize: scaleFont(48),
    fontWeight: '300',
    color: '#d4af37',
    letterSpacing: scaleSize(4),
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: scaleSize(20),
  },

  tagline: {
    fontSize: scaleFont(13),
    color: '#8b8b8b',
    fontWeight: '400',
    letterSpacing: scaleSize(2),
    textTransform: 'uppercase',
  },

  // Main Card - 60% of vertical space
  mainCard: {
    flex: 0.6,
    backgroundColor: '#ffffff',
    borderRadius: scaleSize(16),
    paddingVertical: SCREEN_HEIGHT * 0.06,
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: scaleFont(18),
    fontWeight: '300',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: SCREEN_HEIGHT * 0.04,
    letterSpacing: scaleSize(1),
  },

  // Roles Container - Horizontal Row
  rolesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.04,
  },

  // Role Card Wrapper
  roleCardWrapper: {
    flex: 1,
  },

  // Role Card - Simplified
  roleCard: {
    backgroundColor: '#ffffff',
    borderRadius: scaleSize(12),
    paddingVertical: SCREEN_HEIGHT * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },

  // Role Text - Only title
  roleTitle: {
    fontSize: scaleFont(20),
    fontWeight: '400',
    color: '#1a1a1a',
    letterSpacing: scaleSize(1),
  },

  // Footer - 20% of vertical space
  footer: {
    alignItems: 'center',
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingBottom: SCREEN_HEIGHT * 0.03,
  },
  inspirationalQuote: {
    fontSize: scaleFont(12),
    color: '#8b8b8b',
    textAlign: 'center',
    lineHeight: scaleFont(18),
    fontWeight: '400',
    letterSpacing: scaleSize(0.5),
    marginBottom: scaleSize(16),
    fontStyle: 'italic',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(12),
  },
  footerLink: {
    fontSize: scaleFont(13),
    color: '#d4af37',
    fontWeight: '400',
    letterSpacing: scaleSize(0.5),
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: scaleFont(13),
    color: '#8b8b8b',
  },
});

export default SplashScreen;