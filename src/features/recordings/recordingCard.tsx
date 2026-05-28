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
}

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

export function RecordingCard({ item, onPress, onDelete }: Props): React.ReactElement {
  const openMenu = () => {
    const opts = ['취소', '즐겨찾기', '폴더 이동', '삭제'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opts, destructiveButtonIndex: 3, cancelButtonIndex: 0 },
        (idx) => { if (idx === 3) onDelete(); },
      );
    } else {
      Alert.alert('회의 옵션', '', [
        { text: '취소', style: 'cancel' },
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
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.meta}>{formatDate(item.createdAt)} | {formatDuration(item.durationMs)}</Text>
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
        <View style={styles.badges}>
          <StatusBadge track="recording" state={item.recordingState} />
          <StatusBadge track="upload" state={item.uploadState} />
          <StatusBadge track="transcription" state={item.transcriptionState} />
        </View>
        {item.uploadState === 'uploading' && <UploadProgressBar recordingId={item.id} />}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.heading, color: colors.primary, marginBottom: spacing.xs },
  meta: { ...typography.body, color: colors.secondary, opacity: 0.7 },
  moreIcon: { fontSize: 20, color: colors.secondary },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  deleteAction: {
    backgroundColor: colors.dangerRed,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    marginRight: spacing.lg,
  },
  deleteText: { ...typography.label, color: '#FFFFFF' },
  progressTrack: {
    height: 3,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.accentBlue, borderRadius: 2 },
});
