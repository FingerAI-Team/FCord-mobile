import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, typography } from '../../theme/tokens';

// Stitch 매칭 (stitch_ibk_stt_enterprise_app/splash_screen)
// - 브랜드 + tagline 중앙
// - 하단 1/3 지점 작은 스피너
export function SplashScreen(): React.ReactElement {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>IBK STT</Text>
        <Text style={styles.tagline}>회의를 텍스트로</Text>
      </View>
      <View style={styles.spinnerBlock}>
        <ActivityIndicator color={colors.textSecondary} />
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
  brand: { ...typography.display, color: colors.textOnSurface },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  spinnerBlock: { alignItems: 'center' },
});
