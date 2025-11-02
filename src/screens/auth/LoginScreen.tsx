// src/screens/auth/LoginScreen.tsx - REDESIGNED
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { UserRole, Mode, User } from '../../types';
import { supabase } from '../../config/supabase';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onNavigate: (mode: Mode) => void;
  selectedRole: UserRole;
  onBack?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling
const scaleFont = (size: number) => (SCREEN_WIDTH / 375) * size;
const scaleSize = (size: number) => (SCREEN_WIDTH / 375) * size;

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigate,
  selectedRole,
  onBack,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Fetch last logged-in user profile
  useEffect(() => {
    const fetchLastUser = async () => {
      setFetchingProfile(true);
      try {
        // Check if there's a stored last login email
        const lastEmail = await getLastLoginEmail();
        
        if (lastEmail) {
          // Fetch user profile from database
          const { data, error } = await supabase
            .from('users')
            .select('email, name, profile_image')
            .eq('email', lastEmail)
            .eq('role', selectedRole)
            .single();

          if (!error && data) {
            setUserProfile(data);
          } else {
            // No saved user, show generic profile
            setUserProfile({
              email: `${selectedRole}@example.com`,
              name: selectedRole === 'teacher' ? 'Admin' : 'Student',
              profile_image: null,
            });
          }
        } else {
          // First time user, show generic profile
          setUserProfile({
            email: `${selectedRole}@example.com`,
            name: selectedRole === 'teacher' ? 'Admin' : 'Student',
            profile_image: null,
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setUserProfile({
          email: `${selectedRole}@example.com`,
          name: selectedRole === 'teacher' ? 'Admin' : 'Student',
          profile_image: null,
        });
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchLastUser();
  }, [selectedRole]);

  // Helper to get last login email (from AsyncStorage or similar)
  const getLastLoginEmail = async (): Promise<string | null> => {
    try {
      // TODO: Implement AsyncStorage to remember last logged user
      // const lastEmail = await AsyncStorage.getItem('lastLoginEmail');
      // return lastEmail;
      return null; // For now, return null
    } catch {
      return null;
    }
  };

  // Helper to save last login email
  const saveLastLoginEmail = async (email: string) => {
    try {
      // TODO: Implement AsyncStorage
      // await AsyncStorage.setItem('lastLoginEmail', email);
      console.log('Saved last login email:', email);
    } catch (err) {
      console.error('Error saving last login email:', err);
    }
  };

  // Animation effect
  useEffect(() => {
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
  }, [fadeAnim, slideAnim]);

  const getMaskedEmail = (email: string): string => {
    if (!email || !email.includes('@')) return '';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    
    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    const stars = '*'.repeat(Math.min(localPart.length - 2, 5));
    
    return `${firstChar}${stars}${lastChar}@${domain}`;
  };

  const getInitials = (email: string): string => {
    if (!email) return '?';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const handleLogin = async () => {
    if (!pin) {
      Alert.alert('Required', 'Please enter your PIN');
      return;
    }

    if (!userProfile?.email) {
      Alert.alert('Error', 'No user profile found');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userProfile.email,
        password: pin,
      });

      if (error || !data.user) {
        Alert.alert('Login Failed', 'Invalid PIN');
        setLoading(false);
        return;
      }

      const userRole = data.user.user_metadata?.role as UserRole;
      if (userRole !== selectedRole) {
        Alert.alert('Access Denied', `This account is not a ${selectedRole}`);
        setLoading(false);
        return;
      }

      // Save last login email
      await saveLastLoginEmail(userProfile.email);

      const user: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || '',
        email: data.user.email || '',
        phone: data.user.user_metadata?.phone || '',
        role: userRole,
        batchId: userRole === 'student' ? data.user.user_metadata?.batchId : undefined,
      };

      setLoading(false);
      onLogin(user);
    } catch (err) {
      console.error(err);
      Alert.alert('Login Error', 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Outer Border Box */}
          <View style={styles.profileBorderBox}>
            {/* Inner Profile Box */}
            <View style={styles.profileBox}>
              {fetchingProfile ? (
                <ActivityIndicator color="#d4af37" size="small" />
              ) : userProfile?.profile_image ? (
                <Image 
                  source={{ uri: userProfile.profile_image }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.initialsContainer}>
                  <Text style={styles.initialsText}>
                    {userProfile?.email ? getInitials(userProfile.email) : '?'}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Email Display - Read Only */}
          {userProfile?.email && (
            <Text style={styles.emailDisplay}>
              {getMaskedEmail(userProfile.email)}
            </Text>
          )}
        </View>

        {/* Sign In Card */}
        <View style={styles.signInCard}>
          <Text style={styles.cardTitle}>Sign In</Text>

          {/* PIN Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit PIN"
              placeholderTextColor="#8b8b8b"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Secondary Actions Card */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('forgotPin')}
          >
            <Text style={styles.actionText}>Forgot PIN?</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigate('signup')}
          >
            <Text style={styles.actionText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        {/* Role Badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {selectedRole === 'teacher' ? 'Admin Access' : 'Student Access'}
          </Text>
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
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingVertical: SCREEN_HEIGHT * 0.03,
    justifyContent: 'space-between',
  },

  // Back Button
  backButton: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: scaleFont(28),
    color: '#1a1a1a',
    fontWeight: '300',
    lineHeight: scaleFont(28),
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.02,
  },
  profileBorderBox: {
    padding: scaleSize(8),
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: scaleSize(16),
    backgroundColor: '#ffffff',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileBox: {
    width: scaleSize(100),
    height: scaleSize(100),
    borderRadius: scaleSize(12),
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: scaleFont(36),
    fontWeight: '300',
    color: '#d4af37',
    letterSpacing: scaleSize(2),
  },
  emailDisplay: {
    fontSize: scaleFont(14),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.5),
    marginTop: scaleSize(12),
  },

  // Sign In Card
  signInCard: {
    backgroundColor: '#ffffff',
    borderRadius: scaleSize(16),
    padding: SCREEN_WIDTH * 0.06,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    marginTop: SCREEN_HEIGHT * 0.03,
  },
  cardTitle: {
    fontSize: scaleFont(24),
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: SCREEN_HEIGHT * 0.025,
    letterSpacing: scaleSize(1),
  },

  // Input Group
  inputGroup: {
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  label: {
    fontSize: scaleFont(13),
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: scaleSize(8),
    letterSpacing: scaleSize(0.5),
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(14),
    fontSize: scaleFont(15),
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: scaleSize(8),
    fontWeight: '500',
  },

  // Button
  button: {
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: scaleFont(15),
    fontWeight: '500',
    letterSpacing: scaleSize(1),
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Actions Card (Separate Card)
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: scaleSize(16),
    padding: SCREEN_WIDTH * 0.04,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginTop: SCREEN_HEIGHT * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scaleSize(8),
  },
  actionText: {
    fontSize: scaleFont(13),
    color: '#d4af37',
    letterSpacing: scaleSize(0.3),
    fontWeight: '400',
  },
  actionDivider: {
    width: 1,
    height: scaleSize(24),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  // Role Badge
  roleBadge: {
    alignItems: 'center',
    paddingVertical: scaleSize(8),
  },
  roleBadgeText: {
    fontSize: scaleFont(12),
    color: '#8b8b8b',
    letterSpacing: scaleSize(1),
    textTransform: 'uppercase',
  },
});

export default LoginScreen;