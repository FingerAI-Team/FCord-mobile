// src/components/AppTopBar.tsx
// 공용 상단 헤더: 좌측 뒤로가기(선택), 가운데 제목, 우상단 🏠/⚙ 아이콘
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  title?: string;
  showBack?: boolean;
  active?: 'home' | 'settings';
}

export function AppTopBar({ title, showBack, active }: Props): React.ReactElement {
  const nav = useNavigation<any>();
  return (
    <View style={styles.bar}>
      {showBack ? (
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.back} accessibilityLabel="뒤로가기" accessibilityRole="button">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title ?? ''}</Text>
      <View style={styles.icons}>
        <TouchableOpacity
          style={[styles.iconBtn, active === 'home' && styles.iconBtnActive]}
          onPress={() => nav.navigate('Home')}
          accessibilityLabel="홈"
          accessibilityRole="button"
        >
          <Text style={[styles.icon, active === 'home' && styles.iconActive]}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, active === 'settings' && styles.iconBtnActive]}
          onPress={() => nav.navigate('Settings')}
          accessibilityLabel="설정"
          accessibilityRole="button"
        >
          <Text style={[styles.icon, active === 'settings' && styles.iconActive]}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  spacer: { width: 36 },
  back: { width: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#555', lineHeight: 28 },
  title: { flex: 1, fontSize: 13, fontWeight: '800', color: '#111', letterSpacing: -0.2 },
  icons: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: '#111' },
  icon: { fontSize: 13 },
  iconActive: { color: '#fff' },
});
