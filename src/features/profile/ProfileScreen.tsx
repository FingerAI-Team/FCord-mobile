import React from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';

interface SettingRow {
  id: string;
  label: string;
  value?: string;
  toggle?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

interface SettingSection {
  title: string;
  data: SettingRow[];
}

export function ProfileScreen(): React.ReactElement {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  // 로그아웃 확인 Alert 표시
  const onLogoutPress = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => { void logout(); },
        },
      ],
    );
  };

  // 설정 섹션 정의
  const sections: SettingSection[] = [
    {
      title: '사용자 정보',
      data: [
        { id: 'name', label: '이름', value: session?.user.name ?? '-' },
        { id: 'employee', label: '사번', value: session?.user.id ?? '-' },
        { id: 'dept', label: '부서', value: session?.user.department ?? '-' },
      ],
    },
    {
      title: '보안',
      data: [
        { id: 'biometric', label: 'Face ID / 지문 잠금', toggle: true },
        { id: 'autolock', label: '자동 잠금', value: '1분 후' },
      ],
    },
    {
      title: '동기화',
      data: [
        { id: 'wifionly', label: 'Wi-Fi에서만 업로드', toggle: true },
        { id: 'background', label: '백그라운드 업로드', toggle: true },
      ],
    },
    {
      title: '알림',
      data: [
        { id: 'notify_done', label: '전사 완료 알림', toggle: true },
        { id: 'notify_fail', label: '업로드 실패 알림', toggle: true },
      ],
    },
    {
      title: '데이터 관리',
      data: [
        { id: 'retention', label: '녹음 보관 기간', value: '30일' },
        { id: 'cache', label: '캐시 비우기', onPress: () => {} },
      ],
    },
    {
      title: '앱 정보',
      data: [
        { id: 'version', label: '버전', value: '0.1.0' },
        { id: 'terms', label: '이용약관', onPress: () => {} },
        { id: 'privacy', label: '개인정보처리방침', onPress: () => {} },
        { id: 'logout', label: '로그아웃', danger: true, onPress: onLogoutPress },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* 사용자 헤더 — 아바타 이니셜 + 이름/부서 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{session?.user.name?.[0] ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{session?.user.name ?? '사용자'}</Text>
          <Text style={styles.userSub}>{session?.user.department ?? ''}</Text>
        </View>
      </View>

      {/* 설정 목록 — SectionList로 그룹 렌더링 */}
      <SectionList
        sections={sections}
        keyExtractor={(item: SettingRow) => item.id}
        renderSectionHeader={({ section }: { section: SettingSection }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }: { item: SettingRow }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={item.onPress}
            disabled={!item.onPress && !item.toggle}
            accessibilityRole={item.toggle === true ? 'switch' : 'button'}
          >
            {/* 위험 행(로그아웃)은 빨간색 라벨 */}
            <Text style={[styles.rowLabel, item.danger === true && styles.rowLabelDanger]}>
              {item.label}
            </Text>
            {item.toggle === true ? (
              // 토글 스위치 — 현재는 uncontrolled(MVP), 추후 상태 연결
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ true: colors.accentBlue }}
              />
            ) : item.value !== undefined ? (
              <Text style={styles.rowValue}>{item.value}</Text>
            ) : (
              <Text style={styles.rowArrow}>›</Text>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // 상단 사용자 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  userName: { ...typography.heading, color: colors.textPrimary },
  userSub: { ...typography.body, color: colors.textSecondary },

  // 섹션 헤더
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionTitle: { ...typography.label, color: colors.textSecondary },

  // 설정 행
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    minHeight: 52,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowLabelDanger: { color: colors.dangerRed },
  rowValue: { ...typography.body, color: colors.textSecondary },
  rowArrow: { fontSize: 20, color: colors.textSecondary },

  separator: { height: 1, backgroundColor: colors.borderLight, marginLeft: spacing.lg },
  listContent: { paddingBottom: 40 },
});
