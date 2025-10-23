import React, { useState } from 'react';
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
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { User, UserRole, Mode } from '../../types';
import { supabase } from '../../config/supabase';

interface SignUpScreenProps {
  onSignUp: (user: User) => void;
  onNavigate: (mode: Mode) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [batchCode, setBatchCode] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (role === 'student' && !batchCode) {
      Alert.alert('Error', 'Please enter batch code');
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role,
            batchId: role === 'student' ? batchCode : undefined,
            parentContact: role === 'student' ? parentContact : undefined,
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

      // 2. Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone,
          role,
          batch_id: role === 'student' ? batchCode : null,
          parent_contact: role === 'student' ? parentContact : null,
        });

      if (profileError) {
        Alert.alert('Error', 'Failed to create profile: ' + profileError.message);
        setLoading(false);
        return;
      }

      // 3. Create User object and pass to parent
      const newUser: User = {
        id: authData.user.id,
        name,
        email,
        phone,
        role,
        batchId: role === 'student' ? batchCode : undefined,
        parentContact: role === 'student' ? parentContact : undefined,
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
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>📚</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our learning platform</Text>
          </View>

          <View style={styles.form}>
            {/* Role Selection */}
            <Text style={commonStyles.label}>I am a</Text>
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
                  👨‍🎓 Student
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
                  👨‍🏫 Teacher
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={commonStyles.label}>Full Name *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <Text style={commonStyles.label}>Email *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Text style={commonStyles.label}>Phone Number *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            {role === 'student' && (
              <>
                <Text style={commonStyles.label}>Batch Code *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Enter batch code (e.g., BATCH001)"
                  value={batchCode}
                  onChangeText={setBatchCode}
                  autoCapitalize="characters"
                  editable={!loading}
                />

                <Text style={commonStyles.label}>Parent Contact</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Parent's phone number (optional)"
                  value={parentContact}
                  onChangeText={setParentContact}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </>
            )}

            <Text style={commonStyles.label}>Password *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <Text style={commonStyles.label}>Confirm Password *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[
                commonStyles.button,
                commonStyles.primaryButton,
                styles.signupButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={commonStyles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => onNavigate('login')} disabled={loading}>
                <Text style={styles.loginLinkButton}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    width: '100%',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#f5f3ff',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#7c3aed',
  },
  signupButton: {
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLinkButton: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
});

export default SignUpScreen;