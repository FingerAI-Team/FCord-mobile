import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ServerRecordingCache } from '../../types';
import { StatusBadge } from './statusBadge';
import { useUploadProgress } from '../upload/useUploadProgress';

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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
        activeOpacity={0.7}
        accessibilityLabel={`${item.title}, ${formatDuration(item.durationMs)}`}
        accessibilityRole="button"
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.duration}>{formatDuration(item.durationMs)}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  duration: { fontSize: 13, color: '#6B7280' },
  date: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  progressTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: '#2563EB', borderRadius: 2 },
});
