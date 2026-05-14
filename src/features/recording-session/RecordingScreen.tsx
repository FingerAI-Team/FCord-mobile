import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { createRecordingDraft } from '../../api/recordings';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { buildSavePayload, buildOptimisticItem } from './recordingSessionUtils';

// 초 → MM:SS 포맷
function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RecordingScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { items, setItems } = useRecordingListStore();
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');

  // 파형 애니메이션용 Animated.Value 5개
  const waveAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  // 타이머: 일시정지 중에는 멈춤
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  // 파형 루프 애니메이션: 일시정지 중에는 정지
  useEffect(() => {
    if (isPaused) {
      waveAnims.forEach((anim) => {
        // Animated.Value를 0.3으로 초기화 (mock에서 setValue 없을 수 있으므로 optional chaining)
        (anim as unknown as { setValue?: (v: number) => void }).setValue?.(0.3);
      });
      return;
    }
    const animations = waveAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.3 + (i + 1) * 0.14,
            duration: 300 + i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + i * 80,
            useNativeDriver: true,
          }),
        ])
      )
    );
    // loop()가 반환하는 객체에 start/stop이 없을 수 있으므로 optional chaining
    animations.forEach((a) => (a as unknown as { start?: () => void }).start?.());
    return () =>
      animations.forEach((a) => (a as unknown as { stop?: () => void }).stop?.());
  }, [isPaused, waveAnims]);

  const onStop = () => setSaveModalVisible(true);

  const onSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 서버에 draft 생성 → id 수령
      const payload = buildSavePayload(title, elapsed);
      const { id } = await createRecordingDraft(payload);

      // 목록에 낙관적 추가 (최신순 맨 앞)
      const optimistic = buildOptimisticItem(id, payload.title, elapsed);
      setItems([optimistic, ...items]);
    } finally {
      setIsSaving(false);
      setSaveModalVisible(false);
      navigation.goBack();
    }
  };

  const onCancelSave = () => setSaveModalVisible(false);

  return (
    <View style={styles.container}>
      {/* 닫기 */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        accessibilityLabel="녹음 취소"
      >
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* 타이머 */}
      <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
      <Text style={styles.timerLabel}>{isPaused ? '일시정지' : '녹음 중'}</Text>

      {/* 파형 */}
      <View style={styles.waveform}>
        {waveAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.wavebar, { transform: [{ scaleY: anim }] }]}
          />
        ))}
      </View>

      {/* 컨트롤 */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setIsPaused((p) => !p)}
          accessibilityLabel={isPaused ? '녹음 재개' : '일시정지'}
        >
          <Text style={styles.pauseBtnText}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          accessibilityLabel="녹음 정지"
        >
          <View style={styles.stopIcon} />
        </TouchableOpacity>
      </View>

      {/* 저장 Modal */}
      <Modal
        visible={saveModalVisible}
        animationType="slide"
        transparent
        onRequestClose={onCancelSave}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>녹음 저장</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={`녹음 ${new Date().toLocaleDateString('ko-KR')}`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancelSave}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]}
                onPress={onSave}
                disabled={isSaving}
                accessibilityLabel={isSaving ? '저장 중' : '저장'}
              >
                <Text style={styles.modalSaveText}>{isSaving ? '저장 중...' : '저장'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: colors.textSecondary },
  timer: { fontSize: 56, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  timerLabel: { ...typography.label, color: colors.recordingRed, marginTop: spacing.sm },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing['3xl'],
    height: 80,
  },
  wavebar: {
    width: 6,
    height: 60,
    borderRadius: 3,
    backgroundColor: colors.recordingRed,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xl'],
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnText: { fontSize: 22, color: colors.textPrimary },
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.recordingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.lg },
  titleInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { ...typography.heading, color: colors.textSecondary },
  modalSaveBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.recordingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: { ...typography.heading, color: '#fff' },
});
