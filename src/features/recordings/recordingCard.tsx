// src/features/recordings/recordingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActionSheetIOS, Alert, Platform } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ServerRecordingCache } from '../../types';
import { StatusBadge } from './statusBadge';
import { useUploadProgress } from '../upload/useUploadProgress';
import { colors, spacing, radius, typography } from '../../theme/tokens';

interface Props {
  item: ServerRecordingCache;
  onPress: () => void;
  onDelete: () => void;
  onToggleStar?: () => void;
}

// 카드 제목 옆에 표시할 단일 대표 배지 (HTML .bdg 인라인 구조)
function PrimaryBadge({ item }: { item: ServerRecordingCache }): React.ReactElement | null {
  if (item.transcriptionState === 'completed') {
    return <Text style={[badgeBase, { backgroundColor: '#e8f5e9', color: '#16a34a' }]}>완료</Text>;
  }
  if (item.transcriptionState === 'failed' || item.uploadState === 'failed') {
    return <Text style={[badgeBase, { backgroundColor: '#fce4ec', color: '#dc2626' }]}>실패</Text>;
  }
  if (item.transcriptionState === 'processing' || item.transcriptionState === 'queued') {
    return <Text style={[badgeBase, { backgroundColor: '#fff3e0', color: '#d97706' }]}>변환중</Text>;
  }
  if (item.uploadState === 'uploading' || item.uploadState === 'queued') {
    return <Text style={[badgeBase, { backgroundColor: '#eef1f6', color: '#005BAC' }]}>업로드중</Text>;
  }
  return null;
}
const badgeBase = {
  fontSize: 10, fontFamily: 'Pretendard-Bold',
  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  overflow: 'hidden' as const,
};

function formatDuration(ms?: number): string {
  if (!ms) return '--:--';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function UploadProgressBar({ recordingId }: { recordingId: string }): React.ReactElement | null {
  const { percent } = useUploadProgress(recordingId);
  if (percent === 0) return null;
  return (
    <View style={styles.progressTrack} accessibilityLabel={`업로드 진행률 ${percent}%`}>
      <View style={[styles.progressFill, { width: `${percent}%` as `${number}%` }]} />
    </View>
  );
}

export function RecordingCard({ item, onPress, onDelete, onToggleStar }: Props): React.ReactElement {
  const starLabel = item.isStarred ? '즐겨찾기 해제' : '즐겨찾기';

  const openMenu = () => {
    const opts = ['취소', starLabel, '폴더 이동', '삭제'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opts, destructiveButtonIndex: 3, cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) onToggleStar?.();
          else if (idx === 2) Alert.alert('폴더 이동', '폴더 기능은 준비 중입니다.');
          else if (idx === 3) onDelete();
        },
      );
    } else {
      Alert.alert('회의 옵션', '', [
        { text: '취소', style: 'cancel' },
        { text: starLabel, onPress: () => onToggleStar?.() },
        { text: '삭제', style: 'destructive', onPress: onDelete },
      ]);
    }
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={onDelete}
      accessibilityLabel={`${item.title} 삭제`}
      accessibilityRole="button"
    >
      <Text style={styles.deleteText}>삭제</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.95}
        accessibilityLabel={`${item.title}, ${formatDuration(item.durationMs)}`}
        accessibilityRole="button"
      >
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            {/* 제목 + 주요 배지 인라인 (HTML .card-title 구조) */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <PrimaryBadge item={item} />
              {item.isStarred && <Text style={styles.starIcon}>★</Text>}
            </View>
            <Text style={styles.meta}>
              {formatDate(item.createdAt)} · {formatDuration(item.durationMs)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={openMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`${item.title} 더보기 메뉴`}
            accessibilityRole="button"
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
        {item.uploadState === 'uploading' && <UploadProgressBar recordingId={item.id} />}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dde2eb',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { flex: 1, marginRight: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3, flexWrap: 'wrap' },
  title: { fontSize: 12, fontFamily: 'Pretendard-Bold', color: '#0a1628', flex: 1 },
  starIcon: { fontSize: 11, color: '#e65100' },
  meta: { fontSize: 10, fontFamily: 'Pretendard-Regular', color: '#94a3b8', marginTop: 3 },
  moreIcon: { fontSize: 16, color: '#94a3b8' },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 6 },
  deleteAction: {
    backgroundColor: '#c62828',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 6,
    marginBottom: 6,
    marginRight: 12,
  },
  deleteText: { fontSize: 11, fontFamily: 'Pretendard-Bold', color: '#fff' },
  progressTrack: {
    height: 3,
    backgroundColor: '#dde2eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: { height: 3, backgroundColor: '#94a3b8', borderRadius: 2 },
});
