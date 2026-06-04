import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioRecorderPlayer, {
  AudioSet,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { uploadRecording } from '../../api/recordings';
import { useRecordingListStore } from '../../stores/recordingListStore';

// Android는 mp4/AAC, iOS는 m4a/AAC
const AUDIO_SET: AudioSet = Platform.OS === 'android'
  ? {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.DEFAULT,
    }
  : {
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 1,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
    };

// 파형 바마다 고정 스케일 오프셋 (자연스러운 파형)
const BAR_OFFSETS = [0.75, 1.0, 0.55, 0.9, 0.65];

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RecordingScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { items, setItems } = useRecordingListStore();

  const recorder = useRef(new AudioRecorderPlayer()).current;

  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 파형 애니메이션 (마이크 레벨로 구동)
  const waveAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.15))
  ).current;

  // 파형 루프 애니메이션 ref — stop 호출용
  const waveLoopAnims = useRef<Animated.CompositeAnimation[]>([]);

  // 파형 루프 시작
  const startWaveLoop = useCallback(() => {
    // 이전 루프 정리
    waveLoopAnims.current.forEach((a) => a.stop());
    waveLoopAnims.current = waveAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.15 + BAR_OFFSETS[i] * 0.85,
            duration: 300 + i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.1 + BAR_OFFSETS[i] * 0.15,
            duration: 300 + i * 80,
            useNativeDriver: true,
          }),
        ])
      )
    );
    waveLoopAnims.current.forEach((a) => a.start());
  }, [waveAnims]);

  // 파형 루프 정지 (일시정지/종료 시)
  const stopWaveLoop = useCallback(() => {
    waveLoopAnims.current.forEach((a) => a.stop());
    waveAnims.forEach((anim) =>
      Animated.spring(anim, { toValue: 0.1, useNativeDriver: true, speed: 20, bounciness: 0 }).start()
    );
  }, [waveAnims]);

  // 화면 진입 시 즉시 녹음 + 파형 시작
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const ext = Platform.OS === 'android' ? 'mp4' : 'm4a';
        const fileName = Platform.OS === 'android'
          ? `/data/data/com.ibkstt/cache/rec_${Date.now()}.${ext}`
          : `rec_${Date.now()}.${ext}`;
        await recorder.startRecorder(fileName, AUDIO_SET, true);
        if (!active) return;
        setIsRecording(true);
        startWaveLoop(); // 녹음 시작과 동시에 파형 애니메이션 시작

        recorder.addRecordBackListener((e) => {
          if (!active) return;
          setElapsed(Math.floor(e.currentPosition / 1000));
        });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        Alert.alert('마이크 오류', `녹음 시작 실패: ${msg}`, [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    })();

    return () => {
      active = false;
      stopWaveLoop();
      recorder.stopRecorder().catch(() => {});
      recorder.removeRecordBackListener();
    };
  }, []);

  // 일시정지 / 재개
  const onTogglePause = async () => {
    try {
      if (isPaused) {
        await recorder.resumeRecorder();
        setIsPaused(false);
        startWaveLoop();
      } else {
        await recorder.pauseRecorder();
        setIsPaused(true);
        stopWaveLoop();
      }
    } catch {
      // 구버전 OS에서 pause 미지원 시 UI만 토글
      setIsPaused((p) => !p);
    }
  };

  // 정지 → 파일 URI 확보 → 저장 모달 표시
  const onStop = async () => {
    try {
      const uri = await recorder.stopRecorder();
      recorder.removeRecordBackListener();
      setIsRecording(false);
      setFileUri(uri);
      setSaveModalVisible(true);
    } catch {
      Alert.alert('오류', '녹음을 정지하는 중 문제가 발생했습니다.');
    }
  };

  // 저장 → FAICORD 업로드
  const onSave = async () => {
    if (isSaving || !fileUri) return;
    setIsSaving(true);
    setUploadError(null);

    const resolvedTitle =
      title.trim() || `녹음 ${new Date().toLocaleDateString('ko-KR')}`;
    const fileName = `${resolvedTitle}.m4a`;

    try {
      const { confId } = await uploadRecording(fileUri, fileName, 'audio/mp4', resolvedTitle);

      // 목록 맨 앞에 낙관적 추가
      const now = Date.now();
      setItems([
        {
          id: confId,
          title: resolvedTitle,
          tags: [],
          uploadState: 'uploaded',
          transcriptionState: 'processing',
          recordingState: 'saved_local',
          createdAt: now,
          updatedAt: now,
          cachedAt: now,
          durationMs: elapsed * 1000,
        },
        ...items,
      ]);

      setSaveModalVisible(false);
      navigation.goBack();
    } catch (e: any) {
      setUploadError('업로드에 실패했습니다. 다시 시도해주세요.');
      setIsSaving(false);
    }
  };

  // 취소 → 녹음 파일 폐기
  const onCancelSave = () => {
    Alert.alert(
      '회의가 저장되지 않습니다',
      '취소하면 지금까지 녹음한 내용이 모두 삭제됩니다. 계속하시겠습니까?',
      [
        { text: '계속 녹음', style: 'cancel' },
        {
          text: '취소하고 종료',
          style: 'destructive',
          onPress: () => {
            setFileUri(null);
            setSaveModalVisible(false);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 헤더 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onStop} style={styles.closeBtn} accessibilityLabel="녹음 종료">
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.timer, isPaused && styles.timerPaused]}>
          {formatTimer(elapsed)}
        </Text>
        <View style={styles.timerSpacer}>
          {isRecording && !isPaused && (
            <View style={styles.recDot} />
          )}
        </View>
      </View>

      {/* 파형 (마이크 레벨 반응) */}
      <View style={styles.waveformSection}>
        <View style={styles.waveform}>
          {waveAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  transform: [{ scaleY: anim }],
                  opacity: isPaused ? 0.25 : 0.85,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.waveHint}>
          {isPaused ? '일시정지됨' : isRecording ? '녹음 중...' : '준비 중'}
        </Text>
      </View>

      {/* 빠른 메모 */}
      <View style={styles.memoSection}>
        <Text style={styles.memoLabel}>회의 제목</Text>
        <View style={styles.memoInput}>
          <TextInput
            style={styles.memoField}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요 (선택)"
            placeholderTextColor="#76777d"
            returnKeyType="done"
          />
        </View>
      </View>

      {/* 컨트롤 */}
      <View style={styles.controls}>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={onTogglePause}
            accessibilityLabel={isPaused ? '녹음 재개' : '녹음 일시정지'}
          >
            <Text style={styles.pauseIcon}>{isPaused ? '▶' : '⏸'}</Text>
            <Text style={styles.pauseLabel}>{isPaused ? '재개' : '정지'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={onStop}
            accessibilityLabel="녹음 완료"
          >
            <Text style={styles.stopIcon}>■</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.controlHint}>■ 버튼으로 완료</Text>
      </View>

      {/* 회의종료 모달 */}
      <Modal
        visible={saveModalVisible}
        animationType="slide"
        transparent
        onRequestClose={onCancelSave}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>회의 종료</Text>
            <Text style={styles.modalMeta}>녹음 시간: {formatTimer(elapsed)}</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={`녹음 ${new Date().toLocaleDateString('ko-KR')}`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            {uploadError && (
              <Text style={styles.errorText}>{uploadError}</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onCancelSave}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, isSaving && styles.btnDisabled]}
                onPress={onSave}
                disabled={isSaving}
                accessibilityLabel={isSaving ? '업로드 중' : '회의종료'}
              >
                <Text style={styles.modalSaveText}>
                  {isSaving ? '업로드 중...' : '회의종료'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    fontFamily: 'Pretendard-ExtraBold',
    color: '#0a1628',
    letterSpacing: -2,
    lineHeight: 46,
  },
  timerPaused: { color: '#bbb' },
  timerSpacer: { width: 40, alignItems: 'center', justifyContent: 'center' },
  recDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#EF4444',
  },

  waveformSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 80 },
  waveBar: { width: 4, height: 60, borderRadius: 2, backgroundColor: '#2E8BD6' },
  waveHint: { marginTop: 12, fontSize: 12, color: '#9CA3AF' },

  memoSection: { paddingHorizontal: 24, marginBottom: 48 },
  memoLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#94a3b8',
    marginBottom: 8,
    paddingLeft: 4,
  },
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
  memoField: { fontSize: 15, fontFamily: 'Pretendard-Regular', color: '#1b1b1d', flex: 1 },

  controls: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    gap: 16,
  },
  controlButtons: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  pauseBtn: {
    width: 64, height: 64, borderRadius: 9999,
    backgroundColor: '#f0edee',
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  pauseIcon: { fontSize: 18, color: '#0a1628' },
  pauseLabel: { fontSize: 10, color: '#94a3b8' },
  stopBtn: {
    width: 80, height: 80, borderRadius: 9999,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  stopIcon: { fontSize: 28, color: '#FFFFFF' },
  controlHint: { fontSize: 12, fontFamily: 'Pretendard-Medium', color: '#94a3b8' },

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
  modalTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: 4 },
  modalMeta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  titleInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.dangerRed,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalCancelBtn: {
    flex: 1, height: 52, borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { ...typography.heading, color: colors.textSecondary },
  modalSaveBtn: {
    flex: 1, height: 52, borderRadius: radius.lg,
    backgroundColor: colors.recordingRed,
    alignItems: 'center', justifyContent: 'center',
  },
  modalSaveText: { ...typography.heading, color: '#fff' },
  btnDisabled: { opacity: 0.6 },
});
