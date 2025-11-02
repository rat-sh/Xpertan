// src/screens/auth/SignUpScreen.tsx - PREMIUM REDESIGN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { User, UserRole, Mode } from '../../types';
import { supabase } from '../../config/supabase';

interface SignUpScreenProps {
  onSignUp: (user: User) => void;
  onNavigate: (mode: Mode) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling
const scaleFont = (size: number) => (SCREEN_WIDTH / 375) * size;
const scaleSize = (size: number) => (SCREEN_WIDTH / 375) * size;

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

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

  const handleImagePicker = () => {
    // TODO: Implement image picker
    // For now, show placeholder
    Alert.alert(
      'Choose Profile Picture',
      'Select image source',
      [
        { text: 'Camera', onPress: () => console.log('Camera') },
        { text: 'Gallery', onPress: () => console.log('Gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleSignUp = async () => {
    // Validation
    if (!name || !email || !phone || !pin) {
      Alert.alert('Required Fields', 'Please fill all required fields');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match');
      return;
    }

    if (pin.length < 6) {
      Alert.alert('Invalid PIN', 'PIN must be at least 6 digits');
      return;
    }

    setLoading(true);

    try {
      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: pin,
        options: {
          data: {
            name,
            phone,
            role,
          },
        },
      });

      if (authError) {
        Alert.alert('Signup Failed', authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'Failed to create account');
        setLoading(false);
        return;
      }

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone,
          role,
          profile_image: profileImage || null,
        });

      if (profileError) {
        Alert.alert('Error', 'Failed to create profile: ' + profileError.message);
        setLoading(false);
        return;
      }

      // Create User object
      const newUser: User = {
        id: authData.user.id,
        name,
        email,
        phone,
        role,
      };

      setLoading(false);
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => onSignUp(newUser),
        },
      ]);
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.headerTitle}>Create Account</Text>
          </View>

          {/* Profile Image Upload - Optional */}
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.imagePicker}
              onPress={handleImagePicker}
              activeOpacity={0.8}
            >
              <View style={styles.imagePickerBorder}>
                <View style={styles.imagePickerInner}>
                  {profileImage ? (
                    <Image 
                      source={{ uri: profileImage }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Text style={styles.imagePickerIcon}>📷</Text>
                      <Text style={styles.imagePickerText}>Add Photo</Text>
                      <Text style={styles.imagePickerOptional}>(Optional)</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Role Selection Card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Account Type</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'student' && styles.roleButtonActive
                ]}
                onPress={() => setRole('student')}
                disabled={loading}
              >
                <Text style={[
                  styles.roleButtonText,
                  role === 'student' && styles.roleButtonTextActive
                ]}>
                  Student
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'teacher' && styles.roleButtonActive
                ]}
                onPress={() => setRole('teacher')}
                disabled={loading}
              >
                <Text style={[
                  styles.roleButtonText,
                  role === 'teacher' && styles.roleButtonTextActive
                ]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#8b8b8b"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#8b8b8b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#8b8b8b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {/* PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Create PIN (6 digits)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit PIN"
                placeholderTextColor="#8b8b8b"
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            {/* Confirm PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter PIN"
                placeholderTextColor="#8b8b8b"
                value={confirmPin}
                onChangeText={setConfirmPin}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link Card */}
          <View style={styles.signInCard}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <TouchableOpacity 
              onPress={() => onNavigate('login')} 
              disabled={loading}
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingVertical: SCREEN_HEIGHT * 0.03,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  headerTitle: {
    fontSize: scaleFont(28),
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: scaleSize(1),
  },

  // Profile Image Upload
  profileSection: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  imagePicker: {
    marginBottom: scaleSize(16),
  },
  imagePickerBorder: {
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
  imagePickerInner: {
    width: scaleSize(120),
    height: scaleSize(120),
    borderRadius: scaleSize(12),
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerIcon: {
    fontSize: scaleFont(32),
    marginBottom: scaleSize(4),
  },
  imagePickerText: {
    fontSize: scaleFont(12),
    color: '#d4af37',
    fontWeight: '400',
    letterSpacing: scaleSize(0.5),
  },
  imagePickerOptional: {
    fontSize: scaleFont(10),
    color: '#8b8b8b',
    fontWeight: '400',
    letterSpacing: scaleSize(0.3),
    marginTop: scaleSize(4),
  },

  // Card
  card: {
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
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  cardLabel: {
    fontSize: scaleFont(13),
    fontWeight: '400',
    color: '#8b8b8b',
    marginBottom: scaleSize(12),
    letterSpacing: scaleSize(0.5),
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: scaleFont(20),
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: SCREEN_HEIGHT * 0.025,
    letterSpacing: scaleSize(1),
  },

  // Role Selection
  roleContainer: {
    flexDirection: 'row',
    gap: scaleSize(12),
  },
  roleButton: {
    flex: 1,
    paddingVertical: scaleSize(14),
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: scaleSize(10),
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  roleButtonText: {
    fontSize: scaleFont(14),
    color: '#1a1a1a',
    fontWeight: '400',
    letterSpacing: scaleSize(0.5),
  },
  roleButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
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
  },

  // Button
  button: {
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(8),
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

  // Sign In Link Card
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: scaleSize(16),
    paddingVertical: scaleSize(16),
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    gap: scaleSize(8),
  },
  signInText: {
    fontSize: scaleFont(14),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.3),
  },
  signInLink: {
    fontSize: scaleFont(14),
    color: '#d4af37',
    fontWeight: '500',
    letterSpacing: scaleSize(0.3),
  },

  bottomSpacing: {
    height: SCREEN_HEIGHT * 0.03,
  },
});

export default SignUpScreen;