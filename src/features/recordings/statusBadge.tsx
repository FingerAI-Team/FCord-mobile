// src/features/recordings/statusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Track = 'recording' | 'upload' | 'transcription';

interface BadgeConfig {
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
}

const BADGE_MAP: Record<Track, Record<string, BadgeConfig>> = {
  recording: {
    saved_local: { label: '생성 완료', icon: '✓', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    recording:   { label: '생성 중',   icon: '●', bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    paused:      { label: '일시정지',  icon: '⏸', bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    draft:       { label: '초안',      icon: '○', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  },
  upload: {
    not_started: { label: '업로드 대기', icon: '⏳', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
    queued:      { label: '업로드 예정', icon: '↑',  bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
    uploading:   { label: '업로드 중',   icon: '↑',  bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
    uploaded:    { label: '업로드 완료', icon: '✓',  bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    failed:      { label: '업로드 실패', icon: '✕',  bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    retrying:    { label: '재시도 중',   icon: '↻',  bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  },
  transcription: {
    not_requested: { label: '변환 대기',      icon: '⏳', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
    queued:        { label: '변환 예정',      icon: '☁',  bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
    processing:    { label: '음성파일 변환중', icon: '↻',  bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
    completed:     { label: '변환 완료',      icon: '✓',  bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    failed:        { label: '변환 실패',      icon: '✕',  bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    cancelled:     { label: '취소됨',         icon: '○',  bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  },
};

interface Props {
  track: Track;
  state: string;
}

export function StatusBadge({ track, state }: Props): React.ReactElement | null {
  const cfg = BADGE_MAP[track]?.[state];
  if (!cfg) return null;

  return (
    <View
      style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      accessibilityLabel={`${track === 'recording' ? '녹음' : track === 'upload' ? '업로드' : '전사'} 상태: ${cfg.label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.icon, { color: cfg.text }]}>{cfg.icon}</Text>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 11, fontFamily: 'HankenGrotesk-Medium' },
  label: { fontSize: 11, fontFamily: 'HankenGrotesk-SemiBold' },
});
