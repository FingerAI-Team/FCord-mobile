import React from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/tokens';
import { AppTopBar } from '../../components/AppTopBar';

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
        { id: 'notify_done', label: '변환 완료 알림', toggle: true },
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppTopBar title="설정" active="settings" />

      {/* 아바타 헤더 */}
      <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32, paddingHorizontal: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 9999, backgroundColor: '#141b2b', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontFamily: 'HankenGrotesk-Bold', color: '#7d8497' }}>
            {(session?.user?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 20, fontFamily: 'HankenGrotesk-Bold', color: '#111827', lineHeight: 26, marginBottom: 4 }}>
          {session?.user?.name ?? '-'}
        </Text>
        <Text style={{ fontSize: 15, fontFamily: 'HankenGrotesk-Regular', color: '#585f6c', lineHeight: 22 }}>
          {session?.user?.id ?? '-'}
        </Text>
      </View>

      {/* 설정 리스트 */}
      <SectionList
        sections={sections}
        keyExtractor={(item: SettingRow) => item.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }: { section: SettingSection }) => (
          <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: 'HankenGrotesk-Medium', color: '#585f6c', textTransform: 'uppercase', letterSpacing: 0.8, lineHeight: 14 }}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }: { item: SettingRow }) => (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fcf8fa', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
            onPress={item.onPress ?? (() => {})}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            disabled={!item.onPress}
          >
            <Text style={[{ fontSize: 15, fontFamily: 'HankenGrotesk-Regular', color: '#1b1b1d', lineHeight: 22 }, item.danger === true && { color: '#DC2626' }]}>
              {item.label}
            </Text>
            {item.value !== undefined ? (
              <Text style={{ fontSize: 15, fontFamily: 'HankenGrotesk-Regular', color: '#585f6c' }}>{item.value}</Text>
            ) : item.onPress ? (
              <Text style={{ fontSize: 20, color: '#585f6c' }}>›</Text>
            ) : null}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf8fa' },
});
