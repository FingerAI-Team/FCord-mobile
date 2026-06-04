// FR-10: 재전송(upload)과 재처리(transcription)는 완전 별도 컴포넌트
// 같은 컴포넌트로 통합 금지 (가드레일)
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BaseProps {
  onPress: () => void;
  disabled?: boolean;
}

// 재전송: upload_state === 'failed'일 때만 노출
export function RetryUploadButton({ onPress, disabled }: BaseProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.base, styles.uploadBtn, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="업로드 재전송"
      accessibilityRole="button"
      accessibilityHint="업로드에 실패한 파일을 다시 전송합니다"
    >
      <Text style={styles.uploadText}>↑ 재전송</Text>
    </TouchableOpacity>
  );
}

// 재처리: transcription_state === 'failed'일 때만 노출
export function RetryTranscriptionButton({ onPress, disabled }: BaseProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.base, styles.transcriptionBtn, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="STT 재처리"
      accessibilityRole="button"
      accessibilityHint="음성 인식 처리를 다시 요청합니다"
    >
      <Text style={styles.transcriptionText}>↻ 재처리</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  uploadBtn: { backgroundColor: '#0a1628' },
  transcriptionBtn: { backgroundColor: '#7C3AED' },
  disabled: { opacity: 0.4 },
  uploadText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  transcriptionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
