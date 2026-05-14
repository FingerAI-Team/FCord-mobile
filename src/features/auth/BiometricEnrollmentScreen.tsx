// src/features/auth/BiometricEnrollmentScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import { colors, spacing, radius, typography } from '../../theme/tokens';

interface Props {
  navigation: any;
}

export function BiometricEnrollmentScreen({ navigation }: Props): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const onEnroll = async () => {
    setIsLoading(true);
    try {
      const supported = await Keychain.getSupportedBiometryType();
      if (!supported) {
        navigation.replace('Login');
        return;
      }
      await Keychain.setGenericPassword(
        '@ibk_stt:biometric_enrolled',
        'true',
        { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY }
      );
    } catch {
      // 오류: 그냥 로그인으로 진행
    } finally {
      setIsLoading(false);
      navigation.replace('Login');
    }
  };

  const onSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔐</Text>
        </View>
        <Text style={styles.title}>Face ID로 빠르게 로그인</Text>
        <Text style={styles.body}>
          생체 정보는 기기에 안전하게 저장되며, 앱 세션 잠금 해제 용도로만 사용됩니다.
          정보는 외부로 전송되지 않습니다.
        </Text>

        <View style={styles.reassurance}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.reassuranceText}>사내 보안 정책 준수</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
          onPress={onEnroll}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="생체인증 사용하기"
        >
          {isLoading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={styles.primaryBtnText}>사용하기</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSkip}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="나중에"
        >
          <Text style={styles.secondaryBtnText}>지금은 안 함</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  icon: { fontSize: 48 },
  title: { ...typography.display, color: colors.primary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  lockIcon: { fontSize: 16 },
  reassuranceText: { ...typography.label, color: colors.onSurfaceVariant },
  footer: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.label, color: colors.onPrimary, fontSize: 15 },
  secondaryBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...typography.label, color: colors.secondary },
});
