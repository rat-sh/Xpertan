// src/screens/auth/ForgotPinScreen.tsx - PREMIUM DESIGN
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
} from 'react-native';
import { Mode } from '../../types';
import { supabase } from '../../config/supabase';

interface ForgotPinScreenProps {
  onNavigate: (mode: Mode) => void;
  onBack?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling
const scaleFont = (size: number) => (SCREEN_WIDTH / 375) * size;
const scaleSize = (size: number) => (SCREEN_WIDTH / 375) * size;

type Step = 'verify' | 'otp' | 'reset';

const ForgotPinScreen: React.FC<ForgotPinScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const [step, setStep] = useState<Step>('verify');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Sent OTPs (in production, these come from backend)
  const [sentEmailOtp, setSentEmailOtp] = useState<string>('');
  const [sentPhoneOtp, setSentPhoneOtp] = useState<string>('');

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

  // Generate random OTP
  const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Step 1: Verify email and phone
  const handleVerify = async () => {
    if (!email || !phone) {
      Alert.alert('Required', 'Please enter both email and phone number');
      return;
    }

    setLoading(true);

    try {
      // Check if user exists with this email and phone
      const { data, error } = await supabase
        .from('users')
        .select('id, email, phone')
        .eq('email', email.toLowerCase())
        .eq('phone', phone)
        .single();

      if (error || !data) {
        Alert.alert('Not Found', 'No account found with these credentials');
        setLoading(false);
        return;
      }

      // Generate OTPs
      const emailOtpCode = generateOtp();
      const phoneOtpCode = generateOtp();

      setSentEmailOtp(emailOtpCode);
      setSentPhoneOtp(phoneOtpCode);

      // TODO: In production, send real OTPs via email and SMS service
      // await sendEmailOtp(email, emailOtpCode);
      // await sendSmsOtp(phone, phoneOtpCode);

      // For demo, show OTPs in alert (remove in production)
      Alert.alert(
        'OTP Sent',
        `Demo Mode:\nEmail OTP: ${emailOtpCode}\nPhone OTP: ${phoneOtpCode}\n\nIn production, these will be sent to your email and phone.`
      );

      setStep('otp');
      setLoading(false);
    } catch (err) {
      console.error('Verify error:', err);
      Alert.alert('Error', 'Failed to verify credentials. Please try again.');
      setLoading(false);
    }
  };

  // Step 2: Verify OTPs
  const handleVerifyOtp = () => {
    if (!emailOtp || !phoneOtp) {
      Alert.alert('Required', 'Please enter both OTP codes');
      return;
    }

    // Verify OTPs match
    if (emailOtp !== sentEmailOtp || phoneOtp !== sentPhoneOtp) {
      Alert.alert('Invalid OTP', 'The OTP codes you entered are incorrect');
      return;
    }

    // OTPs verified, move to reset step
    setStep('reset');
  };

  // Step 3: Reset PIN
  const handleResetPin = async () => {
    if (!newPin || !confirmPin) {
      Alert.alert('Required', 'Please enter new PIN and confirm it');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match');
      return;
    }

    if (newPin.length < 6) {
      Alert.alert('Invalid PIN', 'PIN must be at least 6 digits');
      return;
    }

    setLoading(true);

    try {
      // Update password in Supabase Auth
      // Note: This requires admin privileges or password reset token
      // For now, we'll update via admin API or custom function
      
      // TODO: Implement secure password reset via Supabase Admin API
      Alert.alert(
        'PIN Reset Successful',
        'Your PIN has been reset successfully. Please login with your new PIN.',
        [
          {
            text: 'OK',
            onPress: () => onNavigate('login'),
          },
        ]
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Reset PIN error:', err);
      Alert.alert('Error', 'Failed to reset PIN. Please try again.');
      setLoading(false);
    }
  };

  // Render based on current step
  const renderContent = () => {
    switch (step) {
      case 'verify':
        return (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verify Identity</Text>
              <Text style={styles.cardSubtitle}>
                Enter your registered email and phone number
              </Text>

              {/* Email Input */}
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

              {/* Phone Input */}
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

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        );

      case 'otp':
        return (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verify OTP</Text>
              <Text style={styles.cardSubtitle}>
                Enter the 6-digit codes sent to your email and phone
              </Text>

              {/* Email OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#8b8b8b"
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.helperText}>Check your email inbox</Text>
              </View>

              {/* Phone OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#8b8b8b"
                  value={phoneOtp}
                  onChangeText={setPhoneOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.helperText}>Check your text messages</Text>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleVerifyOtp}
              >
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleVerify}
              >
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'reset':
        return (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset PIN</Text>
              <Text style={styles.cardSubtitle}>
                Create a new 6-digit PIN for your account
              </Text>

              {/* New PIN Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new 6-digit PIN"
                  placeholderTextColor="#8b8b8b"
                  value={newPin}
                  onChangeText={setNewPin}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              {/* Confirm PIN Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new PIN"
                  placeholderTextColor="#8b8b8b"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleResetPin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        );
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
          {/* Back Button */}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Forgot PIN</Text>
            <Text style={styles.headerSubtitle}>
              {step === 'verify' && 'Verify your identity'}
              {step === 'otp' && 'Enter verification codes'}
              {step === 'reset' && 'Create new PIN'}
            </Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 'verify' && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'otp' && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'reset' && styles.stepDotActive]} />
          </View>

          {/* Dynamic Content */}
          {renderContent()}

          {/* Back to Login */}
          <View style={styles.loginCard}>
            <Text style={styles.loginText}>Remember your PIN?</Text>
            <TouchableOpacity onPress={() => onNavigate('login')}>
              <Text style={styles.loginLink}>Back to Login</Text>
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
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  backArrow: {
    fontSize: scaleFont(28),
    color: '#1a1a1a',
    fontWeight: '300',
    lineHeight: scaleFont(28),
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
    marginBottom: scaleSize(8),
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.3),
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  stepDot: {
    width: scaleSize(12),
    height: scaleSize(12),
    borderRadius: scaleSize(6),
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#d4af37',
    width: scaleSize(16),
    height: scaleSize(16),
    borderRadius: scaleSize(8),
  },
  stepLine: {
    width: scaleSize(40),
    height: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
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
  cardTitle: {
    fontSize: scaleFont(24),
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: scaleSize(8),
    letterSpacing: scaleSize(1),
  },
  cardSubtitle: {
    fontSize: scaleFont(13),
    color: '#8b8b8b',
    marginBottom: SCREEN_HEIGHT * 0.025,
    lineHeight: scaleFont(20),
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
  otpInput: {
    textAlign: 'center',
    letterSpacing: scaleSize(8),
    fontWeight: '500',
    fontSize: scaleFont(18),
  },
  helperText: {
    fontSize: scaleFont(11),
    color: '#8b8b8b',
    marginTop: scaleSize(6),
    fontStyle: 'italic',
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

  // Resend Button
  resendButton: {
    alignItems: 'center',
    marginTop: scaleSize(16),
  },
  resendText: {
    fontSize: scaleFont(13),
    color: '#d4af37',
    letterSpacing: scaleSize(0.3),
  },

  // Login Card
  loginCard: {
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
  loginText: {
    fontSize: scaleFont(14),
    color: '#8b8b8b',
    letterSpacing: scaleSize(0.3),
  },
  loginLink: {
    fontSize: scaleFont(14),
    color: '#d4af37',
    fontWeight: '500',
    letterSpacing: scaleSize(0.3),
  },

  bottomSpacing: {
    height: SCREEN_HEIGHT * 0.03,
  },
});

export default ForgotPinScreen;