// src/features/onboarding/PermissionPrimerScreen.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Alert,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { colors, spacing, radius, typography } from '../../theme/tokens';

const PERMISSION_INFOS = [
  {
    icon: '🎙',
    title: '마이크',
    body: '회의 음성을 정확하게 캡처합니다. 오프라인에서도 녹음 가능합니다.',
    required: true,
  },
  {
    icon: '🔔',
    title: '알림 (선택)',
    body: '업로드 완료 및 전사 결과 알림을 받을 수 있습니다.',
    required: false,
  },
];

interface Props {
  navigation: any;
}

export function PermissionPrimerScreen({ navigation }: Props): React.ReactElement {
  const onRequestPermissions = async () => {
    const micPerm = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const current = await check(micPerm);
    if (current !== RESULTS.GRANTED) {
      const result = await request(micPerm);
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          '마이크 권한 필요',
          '설정 → 개인 정보 보호 → 마이크에서 IBK STT를 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }
    }
    navigation.replace('BiometricEnrollment');
  };

  const onSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="뒤로">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.micCircle}>
          <Text style={styles.micIcon}>🎙</Text>
        </View>
        <Text style={styles.title}>녹음을 시작하려면{'\n'}마이크 권한이 필요해요</Text>
        <Text style={styles.subtitle}>
          녹음된 음성은 사용자가 직접 업로드하기 전까지 기기에 안전하게 보관되며,
          동의 없이 외부로 공유되지 않습니다.
        </Text>
      </View>

      <View style={styles.infoCards}>
        {PERMISSION_INFOS.map((info) => (
          <View key={info.title} style={styles.infoCard}>
            <Text style={styles.infoIcon}>{info.icon}</Text>
            <Text style={styles.infoText}>{info.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onRequestPermissions}
          accessibilityRole="button"
          accessibilityLabel="권한 요청하기"
        >
          <Text style={styles.primaryBtnText}>권한 요청하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="나중에"
        >
          <Text style={styles.secondaryBtnText}>나중에</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backRow: {
    height: 56,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.onSurface },
  hero: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  micIcon: { fontSize: 40 },
  title: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  infoCards: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoIcon: { fontSize: 20, marginTop: 1 },
  infoText: { ...typography.label, color: colors.onSurface, flex: 1 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...typography.label, color: colors.onPrimary, fontSize: 15 },
  secondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...typography.label, color: colors.outline },
});
