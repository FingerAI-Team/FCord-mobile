// src/features/auth/splashScreen.tsx
// Stitch 매칭 (stitch_ibk_stt_enterprise_app/splash_screen)
// - 브랜드 + tagline 중앙
// - 하단 1/3 지점 작은 커스텀 스피너
// bootstrap()은 AuthGate에서 이미 호출하므로 여기선 생략
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/tokens';

export function SplashScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Image
          source={require('../../../assets/ibk_logo_big.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>IBKS 음성회의록</Text>
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
  logo: {
    width: 180,
    height: 72,
    marginBottom: spacing.lg,
  },
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
