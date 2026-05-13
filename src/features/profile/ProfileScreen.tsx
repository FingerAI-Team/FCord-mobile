import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme/tokens';

// 프로필 화면 placeholder — Task 8에서 완전 구현 예정
export function ProfileScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>프로필</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { ...typography.heading, color: colors.textPrimary },
});
