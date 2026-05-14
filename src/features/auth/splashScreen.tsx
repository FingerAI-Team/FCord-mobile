// src/features/auth/splashScreen.tsx
// Stitch 매칭 (stitch_ibk_stt_enterprise_app/splash_screen)
// - 브랜드 + tagline 중앙
// - 하단 1/3 지점 작은 커스텀 스피너
// bootstrap()은 AuthGate에서 이미 호출하므로 여기선 생략
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/tokens';

export function SplashScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>IBK STT</Text>
        <Text style={styles.tagline}>회의를 텍스트로</Text>
      </View>
      <View style={styles.spinnerBlock}>
        <View style={styles.spinner} />
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
    paddingTop: '40%',
    paddingBottom: '20%',
  },
  brandBlock: { alignItems: 'center' },
  brand: {
    ...typography.display,
    color: colors.onSurface,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  spinnerBlock: { alignItems: 'center' },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderTopColor: colors.onSurface,
  },
});
