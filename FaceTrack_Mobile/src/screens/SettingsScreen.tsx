import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { COLORS } from '../theme/colors';

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const SectionCard = ({ title, subtitle, children }: SectionCardProps) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
    {children}
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  disabled?: boolean;
  hint?: string;
}

const InfoRow = ({ label, value, disabled, hint }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View
      style={[styles.infoValueBox, disabled && styles.infoValueBoxDisabled]}
    >
      <Text style={[styles.infoValue, disabled && styles.infoValueDisabled]}>
        {value || '—'}
      </Text>
    </View>
    {hint && <Text style={styles.infoHint}>{hint}</Text>}
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const SettingsScreen = () => {
  const { user, logout } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const userTypeLabel =
    user?.userType === 'faculty'
      ? 'Faculty'
      : user?.userType === 'shs'
      ? 'SHS Student'
      : 'College Student';

  const handleChangePassword = async () => {
    setPwMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMessage({
        type: 'error',
        text: 'New password must be at least 8 characters.',
      });
      return;
    }

    setPwLoading(true);
    try {
      // The backend uses /auth/update-password with email + code + newPassword
      // For in-app password change, we call a user-specific endpoint.
      // Adjust the endpoint path to match your backend's change-password route.
      await apiService.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPwMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMessage({
        type: 'error',
        text: err.message || 'Failed to change password.',
      });
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeactivateAccount = () => {
    Alert.prompt(
      'Deactivate Account',
      'Enter your password to confirm. Your face will no longer be recognized by the system.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Error', 'Password is required.');
              return;
            }
            setDeactivateLoading(true);
            try {
              await apiService.post('/auth/deactivate-account', { currentPassword: password });
              Alert.alert('Account Deactivated', 'Your account has been deactivated. You will be logged out.', [
                { text: 'OK', onPress: () => logout() },
              ]);
            } catch (err: any) {
              const msg = err?.message || 'Failed to deactivate account.';
              Alert.alert('Error', msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('password')
                ? 'Incorrect password. Please try again.'
                : msg);
            } finally {
              setDeactivateLoading(false);
            }
          },
        },
      ],
      'secure-text'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              await logout();
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Title ── */}
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleText}>Settings</Text>
          <Text style={styles.pageTitleSub}>
            Manage your account and preferences
          </Text>
        </View>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>{userTypeLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Personal Information ── */}
        <SectionCard
          title="Personal Information"
          subtitle="Your account details"
        >
          <InfoRow
            label="Full Name"
            value={user?.name ?? ''}
            disabled
            hint="Contact admin to change your name"
          />
          <InfoRow
            label="Email Address"
            value={user?.email ?? ''}
            disabled
            hint="Contact admin to change your email"
          />
          <InfoRow
            label="Account Type"
            value={userTypeLabel}
            disabled
          />
          <InfoRow
            label="Role"
            value={user?.role ?? ''}
            disabled
          />
        </SectionCard>

        {/* ── Change Password ── */}
        <SectionCard
          title="Change Password"
          subtitle="Keep your account secure"
        >
          {/* Message */}
          {pwMessage && (
            <View
              style={[
                styles.pwMessage,
                pwMessage.type === 'success'
                  ? styles.pwMessageSuccess
                  : styles.pwMessageError,
              ]}
            >
              <Text
                style={[
                  styles.pwMessageText,
                  pwMessage.type === 'success'
                    ? styles.pwMessageTextSuccess
                    : styles.pwMessageTextError,
                ]}
              >
                {pwMessage.text}
              </Text>
            </View>
          )}

          {/* Current Password */}
          <Text style={styles.fieldLabel}>Current Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter current password"
              placeholderTextColor={COLORS.placeholder}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity
              onPress={() => setShowCurrent((v) => !v)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeToggle}>{showCurrent ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <Text style={styles.fieldLabel}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password (min 8 chars)"
              placeholderTextColor={COLORS.placeholder}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity
              onPress={() => setShowNew((v) => !v)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeToggle}>{showNew ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.fieldLabel}>Confirm New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((v) => !v)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeToggle}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, pwLoading && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={pwLoading}
            activeOpacity={0.85}
          >
            {pwLoading ? (
              <ActivityIndicator color={COLORS.dark} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </SectionCard>

        {/* ── App Info ── */}
        <SectionCard title="App Info" subtitle="FaceTrack Mobile">
          <InfoRow label="Version" value="1.0.0" disabled />
          <InfoRow
            label="Backend"
            value="FaceTrack API v1"
            disabled
          />
          <InfoRow
            label="Institution"
            value="NU Dasmariñas"
            disabled
          />
        </SectionCard>

        {/* ── Deactivate Account ── */}
        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={handleDeactivateAccount}
          activeOpacity={0.85}
        >
          <Text style={styles.deactivateBtnText}>Deactivate Account</Text>
        </TouchableOpacity>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, logoutLoading && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={logoutLoading}
          activeOpacity={0.85}
        >
          {logoutLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>© 2024 Team Jarvis. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Page title
  pageTitle: {
    marginBottom: 20,
  },
  pageTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  pageTitleSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Profile card
  profileCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.brown,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    color: COLORS.dark,
    fontSize: 26,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    color: COLORS.cream,
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 6,
  },
  profileBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gold + '30',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  profileBadgeText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
  },

  // Section card
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Info rows
  infoRow: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoValueBox: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoValueBoxDisabled: {
    backgroundColor: '#F0EDE8',
  },
  infoValue: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  infoValueDisabled: {
    color: COLORS.textMuted,
  },
  infoHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Password fields
  fieldLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textDark,
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  eyeToggle: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },

  // Password message
  pwMessage: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  pwMessageSuccess: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success,
  },
  pwMessageError: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
  },
  pwMessageText: {
    fontSize: 13,
  },
  pwMessageTextSuccess: {
    color: COLORS.success,
  },
  pwMessageTextError: {
    color: COLORS.error,
  },

  // Save button
  saveBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '800',
  },

  // Deactivate
  deactivateBtn: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  deactivateBtnText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
  },

  // Logout
  logoutBtn: {
    backgroundColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    opacity: 0.5,
  },
});
