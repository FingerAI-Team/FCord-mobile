import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme/tokens';

// 검색 화면 placeholder — Task 6에서 완전 구현 예정
export function SearchScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>검색</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { ...typography.heading, color: colors.textPrimary },
});
