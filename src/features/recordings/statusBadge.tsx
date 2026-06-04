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
    saved_local: { label: '생성 완료', icon: '✓', bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    recording:   { label: '생성 중',   icon: '●', bg: '#fce4ec', text: '#c62828', border: '#f8bbd0' },
    paused:      { label: '일시정지',  icon: '⏸', bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
    draft:       { label: '초안',      icon: '○', bg: '#eef1f6', text: '#94a3b8', border: '#dde2eb' },
  },
  upload: {
    not_started: { label: '업로드 대기', icon: '⏳', bg: '#eef1f6', text: '#94a3b8', border: '#dde2eb' },
    queued:      { label: '업로드 예정', icon: '↑',  bg: '#eef1f6', text: '#0a1628', border: '#dde2eb' },
    uploading:   { label: '업로드 중',   icon: '↑',  bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
    uploaded:    { label: '업로드 완료', icon: '✓',  bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    failed:      { label: '업로드 실패', icon: '✕',  bg: '#fce4ec', text: '#c62828', border: '#f8bbd0' },
    retrying:    { label: '재시도 중',   icon: '↻',  bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
  },
  transcription: {
    not_requested: { label: '변환 대기',      icon: '⏳', bg: '#eef1f6', text: '#94a3b8', border: '#dde2eb' },
    queued:        { label: '변환 예정',      icon: '☁',  bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
    processing:    { label: '음성파일 변환중', icon: '↻',  bg: '#fff3e0', text: '#e65100', border: '#ffe0b2' },
    completed:     { label: '변환 완료',      icon: '✓',  bg: '#e8f5e9', text: '#2e7d32', border: '#c8e6c9' },
    failed:        { label: '변환 실패',      icon: '✕',  bg: '#fce4ec', text: '#c62828', border: '#f8bbd0' },
    cancelled:     { label: '취소됨',         icon: '○',  bg: '#eef1f6', text: '#94a3b8', border: '#dde2eb' },
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
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 10, fontFamily: 'Pretendard-Regular' },
  label: { fontSize: 10, fontFamily: 'Pretendard-Bold' },
});
