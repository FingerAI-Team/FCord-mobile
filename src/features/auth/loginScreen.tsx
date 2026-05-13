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
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { MOCK_LOGIN_HINT } from '../../auth';
import { colors, spacing, radius, typography, buttonHeights, inputHeight } from '../../theme/tokens';

// Stitch 디자인 매칭 (stitch_ibk_stt_enterprise_app/login_screen)
// - SSO: 검은 pill 버튼 + 자물쇠 아이콘
// - 입력: 회색 surfaceContainerLow 배경, border 없음, floating label
// - 보조 버튼: 라벤더 secondaryContainer
// - fallback section은 기본 펼침 (Stitch 디자인 기준)

export function LoginScreen(): React.ReactElement {
  const { login, isSubmitting, error, clearError } = useAuthStore();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [employeeIdFocused, setEmployeeIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const onSSOPress = () => {
    clearError();
    void login({ kind: 'sso' });
  };

  const onPasswordSubmit = () => {
    clearError();
    if (!employeeId.trim() || !password) return;
    void login({ kind: 'password', employeeId: employeeId.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top brand bar (Stitch: VocalLog → IBK STT로 교정) */}
      <View style={styles.topBar}>
        <Text style={styles.brandWordmark}>IBK STT</Text>
        <View style={styles.profileChip} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Heading section */}
        <View style={styles.headingSection}>
          <Text style={styles.brandLabel}>IBK STT</Text>
          <Text style={styles.title}>로그인</Text>
          <Text style={styles.subtitle}>사내 SSO 계정으로 시작하세요</Text>
        </View>

        {/* Primary SSO button — pill, 자물쇠 아이콘 */}
        <TouchableOpacity
          style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
          onPress={onSSOPress}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="IBK 사내 SSO로 로그인"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <View style={styles.btnInner}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.primaryBtnText}>IBK SSO로 로그인</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.providerNote}>
          현재 가상 SSO로 동작합니다. IBK투자증권 SSO 사양 수령 후 자동 전환됩니다.
        </Text>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는 사번으로 로그인</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Fallback form (Stitch: 기본 펼침) */}
        <View style={styles.fallbackBox}>
          {/* Floating label input — 사번 */}
          <View style={styles.inputWrap}>
            <Text
              style={[
                styles.floatingLabel,
                (employeeIdFocused || employeeId.length > 0) && styles.floatingLabelFocused,
              ]}
            >
              사번
            </Text>
            <TextInput
              style={styles.input}
              value={employeeId}
              onChangeText={setEmployeeId}
              onFocus={() => setEmployeeIdFocused(true)}
              onBlur={() => setEmployeeIdFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              editable={!isSubmitting}
            />
          </View>

          {/* Floating label input — 비밀번호 */}
          <View style={[styles.inputWrap, { marginTop: spacing.md }]}>
            <Text
              style={[
                styles.floatingLabel,
                (passwordFocused || password.length > 0) && styles.floatingLabelFocused,
              ]}
            >
              비밀번호
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />
          </View>

          {/* Secondary button — 라벤더 */}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              (isSubmitting || !employeeId.trim() || !password) && styles.btnDisabled,
            ]}
            onPress={onPasswordSubmit}
            disabled={isSubmitting || !employeeId.trim() || !password}
            accessibilityRole="button"
            accessibilityLabel="사번 비밀번호로 로그인"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.textOnSecondaryContainer} />
            ) : (
              <Text style={styles.secondaryBtnText}>로그인</Text>
            )}
          </TouchableOpacity>

          {__DEV__ && (
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>개발 모드 힌트</Text>
              <Text style={styles.hintText}>
                사번: {MOCK_LOGIN_HINT.employeeId} / 비번: {MOCK_LOGIN_HINT.password}
              </Text>
              <Text style={styles.hintText}>{MOCK_LOGIN_HINT.note}</Text>
            </View>
          )}
        </View>

        {error && (
          <View
            style={styles.errorBox}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`로그인 오류: ${error.message}`}
          >
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        )}

        {/* Decorative footer (Stitch flourish) */}
        <View style={styles.footerAccent} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  topBar: {
    height: 64,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  brandWordmark: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: '800',
  },
  profileChip: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },

  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
  },

  headingSection: { marginBottom: spacing['3xl'], alignItems: 'center' },
  brandLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.textOnSurface,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Primary SSO pill
  primaryBtn: {
    height: buttonHeights.primary,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lockIcon: { fontSize: 18, color: colors.onPrimary, marginRight: spacing.sm },
  primaryBtnText: { ...typography.heading, color: colors.onPrimary },
  btnDisabled: { opacity: 0.6 },

  providerNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing['3xl'] },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },

  fallbackBox: { width: '100%' },

  // Floating label input — Stitch 디자인 매칭
  inputWrap: {
    position: 'relative',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.lg,
    height: inputHeight,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.textOnSurface,
    paddingHorizontal: spacing.lg,
    paddingTop: 18, // floating label 자리
    paddingBottom: 6,
    height: inputHeight,
  },
  floatingLabel: {
    position: 'absolute',
    left: spacing.lg,
    ...typography.body,
    color: colors.textSecondary,
    top: (inputHeight - 22) / 2,
  },
  floatingLabelFocused: {
    top: 8,
    fontSize: 11,
    fontWeight: '600',
  },

  // Secondary button — 라벤더
  secondaryBtn: {
    height: buttonHeights.secondary,
    borderRadius: radius.lg,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  secondaryBtnText: {
    ...typography.heading,
    color: colors.textOnSecondaryContainer,
  },

  hintBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintTitle: { ...typography.caption, fontWeight: '700', color: '#92400E', marginBottom: spacing.xs },
  hintText: { ...typography.caption, color: '#92400E' },

  errorBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.dangerRed, color: '#FFFFFF',
    textAlign: 'center', fontWeight: '800', fontSize: 13, lineHeight: 20,
    marginRight: spacing.sm,
  },
  errorText: { flex: 1, color: '#991B1B', ...typography.body, fontSize: 13 },

  footerAccent: {
    alignSelf: 'center',
    width: 64, height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
    opacity: 0.4,
    marginTop: spacing['3xl'],
  },
});
