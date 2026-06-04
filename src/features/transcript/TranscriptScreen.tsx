// src/features/transcript/TranscriptScreen.tsx
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';

const SPEAKER_COLORS = [
  { bg: '#eef1f6', text: '#0a1628', border: '#dde2eb' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF' },
  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
  { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
];

function speakerColor(label: string) {
  const idx = label.charCodeAt(label.length - 1) % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[idx];
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
  navigation: any;
  route: { params: { id: string } };
}

export function TranscriptScreen({ navigation, route }: Props): React.ReactElement {
  const { id } = route.params;
  const {
    segments, editMode, pendingEdits, isLoading, error,
    loadTranscript, toggleEditMode, editSegment, saveEdits, reset,
  } = useTranscriptStore();

  // 원문 / 편집본 탭
  const [activeTab, setActiveTab] = React.useState<'original' | 'edited'>('original');

  useEffect(() => {
    void loadTranscript(id);
    return () => reset();
  }, [id, loadTranscript, reset]);

  const onSave = async () => {
    await saveEdits();
    if (!useTranscriptStore.getState().error) return;
    Alert.alert('저장 실패', '편집 내용을 저장하지 못했습니다. 다시 시도해주세요.');
  };

  if (isLoading && segments.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentBlue} />
      </View>
    );
  }

  if (error && segments.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void loadTranscript(id)}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>음성 변환 내용</Text>
        <View style={styles.editBtnPlaceholder} />
      </View>

      {/* 원문 / 편집본 탭 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'original' && styles.tabActive]}
          onPress={() => setActiveTab('original')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'original' }}
        >
          <Text style={[styles.tabText, activeTab === 'original' && styles.tabTextActive]}>원문</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'edited' && styles.tabActive]}
          onPress={() => { setActiveTab('edited'); if (!editMode) toggleEditMode(); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'edited' }}
        >
          <Text style={[styles.tabText, activeTab === 'edited' && styles.tabTextActive]}>편집본</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noticeBanner}>
        <Text style={styles.noticeIcon}>🔒</Text>
        <Text style={styles.noticeText}>
          자동 생성된 회의록은 개인정보 보호를 위해{' '}
          <Text style={styles.noticeBold}>내부망 PC</Text>에서만 조회 가능합니다.
        </Text>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} accessibilityLabel="내보내기" accessibilityRole="button">
          <Text style={styles.toolBtnText}>📤 내보내기</Text>
        </TouchableOpacity>
        {activeTab === 'edited' && (
          <TouchableOpacity
            style={[styles.toolBtn, styles.toolBtnPrimary]}
            onPress={onSave}
            accessibilityLabel="편집 저장"
            accessibilityRole="button"
          >
            <Text style={styles.toolBtnTextPrimary}>💾 저장</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {segments.map((seg) => {
          const sc = speakerColor(seg.speakerLabel);
          const editedText = pendingEdits[seg.id] ?? seg.text;
          const isEditTab = activeTab === 'edited';
          return (
            <View key={seg.id} style={styles.segment}>
              <View style={styles.segMeta}>
                <View style={[styles.speakerChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.speakerLabel, { color: sc.text }]}>{seg.speakerLabel}</Text>
                </View>
                <Text style={styles.timestamp}>{formatMs(seg.startMs)}</Text>
              </View>
              {isEditTab ? (
                <TextInput
                  style={styles.editInput}
                  value={editedText}
                  onChangeText={(t: string) => editSegment(seg.id, t)}
                  multiline
                  accessibilityLabel={`${seg.speakerLabel} 발화 편집`}
                />
              ) : (
                <Text style={styles.segText}>{seg.text}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {isLoading && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={colors.onPrimary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  backBtn: { paddingRight: spacing.md },
  backIcon: { fontSize: 20, color: colors.onSurface },
  headerTitle: { ...typography.heading, flex: 1, color: colors.onSurface },
  editBtn: { paddingLeft: spacing.md },
  editBtnText: { ...typography.label, color: colors.accentBlue },
  editBtnSave: { color: colors.successGreen },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120 },
  segment: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  segMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  speakerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  speakerLabel: { ...typography.caption },
  timestamp: { ...typography.caption, color: colors.outline },
  segText: { ...typography.body, color: colors.onSurface, paddingLeft: spacing.xs },
  editInput: {
    ...typography.body,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  retryBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...typography.label, color: colors.onPrimary },
  errorText: { ...typography.body, color: colors.error },
  savingOverlay: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  toolBtnText: { fontSize: 10, fontWeight: '700', color: colors.secondary },
  editBtnPlaceholder: { width: 40 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0a1628',
    marginBottom: -1.5,
  },
  tabText: { fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: '#94a3b8' },
  tabTextActive: { color: '#0a1628' },
  toolBtnPrimary: { backgroundColor: '#0a1628', borderRadius: 8 },
  toolBtnTextPrimary: { ...typography.label, color: '#fff' },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    margin: 12,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  noticeIcon: { fontSize: 14, lineHeight: 16 },
  noticeText: { flex: 1, fontSize: 11, color: '#9a3412', lineHeight: 16 },
  noticeBold: { fontWeight: '800' },
});
