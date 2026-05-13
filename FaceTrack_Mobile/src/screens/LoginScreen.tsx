import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/colors';

// ─── Component ────────────────────────────────────────────────────────────────

const LoginScreen = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
    } catch (err: any) {
      // Map common error types to friendly messages
      const msg: string = err?.message ?? '';

      if (
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('timed out') ||
        msg.toLowerCase().includes('aborted') ||
        msg.toLowerCase().includes('network request failed')
      ) {
        setError(
          'Cannot reach the server. Make sure you are on the same Wi-Fi network as the backend and that the server is running.'
        );
      } else if (
        msg.toLowerCase().includes('invalid') ||
        msg.toLowerCase().includes('credentials') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('login failed')
      ) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('not found')) {
        setError('No account found with that email address.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / Branding ── */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <View style={styles.logoInner} />
            </View>
            <Text style={styles.brandTitle}>FaceTrack</Text>
            <Text style={styles.brandSubtitle}>
              Intelligent Attendance Management
            </Text>
          </View>

          {/* ── Login Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {/* Error Banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!loading}
            />

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.passwordRow, loading && styles.inputDisabled]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={COLORS.dark} size="small" />
                  <Text style={styles.loginBtnLoadingText}>  Signing in…</Text>
                </View>
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <Text style={styles.footer}>© 2024 Team Jarvis. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brown,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    opacity: 0.9,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: '#140E05',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.brown,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.6,
    marginBottom: 20,
  },

  // Error
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    lineHeight: 18,
  },

  // Fields
  fieldLabel: {
    color: COLORS.cream,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
    marginBottom: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  eyeToggleText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },

  // Login button
  loginBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtnLoadingText: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '700',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: COLORS.cream,
    opacity: 0.3,
    fontSize: 11,
    marginTop: 24,
  },
});
