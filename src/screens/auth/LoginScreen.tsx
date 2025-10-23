// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { commonStyles } from '../../styles/commonStyles';
import { UserRole, Mode, User } from '../../types';
import { supabase } from '../../config/supabase'; // your supabase client

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onNavigate: (mode: Mode) => void;
  selectedRole: UserRole; // required to enforce role-based login
  onBack?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigate,
  selectedRole,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        Alert.alert('Login Failed', error?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Role enforcement - assume role stored in user metadata
      const userRole = data.user.user_metadata?.role as UserRole;
      if (userRole !== selectedRole) {
        Alert.alert('Access Denied', `This account is not a ${selectedRole}`);
        setLoading(false);
        return;
      }

      // Construct User object
      const user: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || '',
        email: data.user.email || '',
        phone: data.user.user_metadata?.phone || '',
        role: userRole,
        batchId:
          userRole === 'student' ? data.user.user_metadata?.batchId : undefined,
      };

      setLoading(false);
      onLogin(user);
    } catch (err) {
      console.log(err);
      Alert.alert('Login Error', 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const getRoleIcon = () => (selectedRole === 'teacher' ? '👨‍🏫' : '👨‍🎓');
  const getRoleText = () =>
    selectedRole === 'teacher' ? 'Teacher' : 'Student';

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.container}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Text style={styles.logo}>{getRoleIcon()}</Text>
          <Text style={styles.title}>{getRoleText()} Login</Text>
          <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Text style={commonStyles.label}>Email</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={commonStyles.label}>Password</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              commonStyles.button,
              commonStyles.primaryButton,
              styles.loginButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={commonStyles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, styles.signupButton]}
            onPress={() => onNavigate('signup')}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  backButtonText: { fontSize: 16, color: '#7c3aed', fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: '#6b7280' },

  form: { width: '100%' },

  forgotPassword: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 24 },

  forgotPasswordText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },

  loginButton: { marginTop: 8 },

  disabledButton: { opacity: 0.6 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },

  dividerLine: { flex: 1, height: 1, backgroundColor: '#d1d5db' },

  dividerText: { 
    marginHorizontal: 16, 
    color: '#6b7280', 
    fontSize: 14 },

  signupButton: {
    backgroundColor: '#fff',
    borderWidth: 2,

    borderColor: '#7c3aed',
  },
  signupButtonText: { color: '#7c3aed', fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;
