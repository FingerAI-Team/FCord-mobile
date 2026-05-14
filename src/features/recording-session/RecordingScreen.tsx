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
      {/* 상단 헤더 (닫기 + 타이머) */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onStop} style={styles.closeBtn} accessibilityLabel="녹음 종료">
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
        <View style={styles.timerSpacer} />
      </View>

      {/* 웨이브폼 */}
      <View style={styles.waveformSection}>
        <View style={styles.waveform}>
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  transform: [{ scaleY: anim }],
                  opacity: isPaused ? 0.3 : 0.8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* 빠른 메모 */}
      <View style={styles.memoSection}>
        <Text style={styles.memoLabel}>빠른 메모</Text>
        <View style={styles.memoInput}>
          <TextInput
            style={styles.memoField}
            value={title}
            onChangeText={setTitle}
            placeholder="녹음 제목 또는 메모..."
            placeholderTextColor="#76777d"
            returnKeyType="done"
          />
        </View>
      </View>

      {/* 하단 컨트롤 */}
      <View style={styles.controls}>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={() => setIsPaused((p) => !p)}
            accessibilityLabel={isPaused ? '녹음 재개' : '녹음 일시정지'}
            accessibilityRole="button"
          >
            <Text style={styles.pauseIcon}>{isPaused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={onStop}
            accessibilityLabel="녹음 정지"
            accessibilityRole="button"
          >
            <Text style={styles.stopIcon}>■</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.controlHint}>탭하여 정지</Text>
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
  container: { flex: 1, backgroundColor: '#fcf8fa' },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  closeIcon: { fontSize: 20, color: '#1b1b1d' },
  timer: {
    fontSize: 40,
    fontFamily: 'HankenGrotesk-ExtraBold',
    color: '#000000',
    letterSpacing: -2,
    lineHeight: 46,
  },
  timerSpacer: { width: 40 },
  waveformSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 80 },
  waveBar: {
    width: 4,
    height: 60,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  memoSection: { paddingHorizontal: 24, marginBottom: 48 },
  memoLabel: { fontSize: 12, fontFamily: 'HankenGrotesk-Medium', color: '#585f6c', marginBottom: 8, paddingLeft: 4 },
  memoInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  memoField: { fontSize: 15, fontFamily: 'HankenGrotesk-Regular', color: '#1b1b1d', flex: 1 },
  controls: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    gap: 16,
  },
  controlButtons: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#f0edee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: { fontSize: 22, color: '#000000' },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  stopIcon: { fontSize: 28, color: '#FFFFFF' },
  controlHint: { fontSize: 12, fontFamily: 'HankenGrotesk-Medium', color: '#585f6c' },
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
