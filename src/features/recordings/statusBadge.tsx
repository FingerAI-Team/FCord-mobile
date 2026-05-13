import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Track = 'recording' | 'upload' | 'transcription';

interface BadgeConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
}

// 색 + 텍스트 라벨 병기 필수 (가드레일: 색만으로 상태 구분 금지)
const BADGE_MAP: Record<Track, Record<string, BadgeConfig>> = {
  recording: {
    saved_local: { label: '저장됨', backgroundColor: '#E5E7EB', textColor: '#374151' },
    recording:   { label: '녹음 중', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    paused:      { label: '일시정지', backgroundColor: '#FEF3C7', textColor: '#92400E' },
    draft:       { label: '초안', backgroundColor: '#F3F4F6', textColor: '#6B7280' },
  },
  upload: {
    not_started: { label: '업로드 대기', backgroundColor: '#F3F4F6', textColor: '#6B7280' },
    queued:      { label: '업로드 예정', backgroundColor: '#EFF6FF', textColor: '#1D4ED8' },
    uploading:   { label: '업로드 중',   backgroundColor: '#DBEAFE', textColor: '#1D4ED8' },
    uploaded:    { label: '업로드 완료', backgroundColor: '#D1FAE5', textColor: '#065F46' },
    failed:      { label: '업로드 실패', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    retrying:    { label: '재시도 중',   backgroundColor: '#FEF3C7', textColor: '#92400E' },
  },
  transcription: {
    not_requested: { label: 'STT 대기',   backgroundColor: '#F3F4F6', textColor: '#6B7280' },
    queued:        { label: 'STT 예정',   backgroundColor: '#EDE9FE', textColor: '#5B21B6' },
    processing:    { label: 'STT 처리 중', backgroundColor: '#EDE9FE', textColor: '#5B21B6' },
    completed:     { label: '전사 완료',  backgroundColor: '#D1FAE5', textColor: '#065F46' },
    failed:        { label: 'STT 실패',   backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    cancelled:     { label: '취소됨',     backgroundColor: '#F3F4F6', textColor: '#6B7280' },
  },
};

const TRACK_LABELS: Record<Track, string> = {
  recording: '녹음',
  upload: '업로드',
  transcription: '전사',
};

interface Props {
  track: Track;
  state: string;
}

export function StatusBadge({ track, state }: Props): React.ReactElement | null {
  const config = BADGE_MAP[track]?.[state];
  if (!config) return null;

  return (
    <View
      style={[styles.badge, { backgroundColor: config.backgroundColor }]}
      accessibilityLabel={`${TRACK_LABELS[track]} 상태: ${config.label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
