import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../db/database';
import { LocalRecordingModel } from '../../db/models/LocalRecordingModel';
import { LocalUploadQueueModel } from '../../db/models/LocalUploadQueueModel';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { softDeleteRecording, updateRecordingMeta, retryTranscription, requestTranscription } from '../../api/recordings';
import { retryUpload } from '../upload/uploadService';
import { StatusBadge } from './statusBadge';
import { RetryUploadButton, RetryTranscriptionButton } from './retryButtons';
import { DeleteConfirmModal } from './deleteConfirmModal';
import { useUploadProgress } from '../upload/useUploadProgress';
import { resolveDetailActions, shouldSaveTitle } from './recordingDetailUtils';
import { AppTopBar } from '../../components/AppTopBar';

interface Props {
  navigation: any;
  route: { params: { id: string; queueId?: string } };
}

function InternalOnlyBanner(): React.ReactElement {
  return (
    <View style={styles.noticeBanner}>
      <Text style={styles.noticeIcon}>🔒</Text>
      <Text style={styles.noticeText}>
        자동 생성된 회의록은 개인정보 보호를 위해{' '}
        <Text style={styles.noticeBold}>내부망 PC</Text>에서만 조회 가능합니다.
      </Text>
    </View>
  );
}

function UploadProgressSection({ recordingId }: { recordingId: string }): React.ReactElement | null {
  const { percent, etaSeconds } = useUploadProgress(recordingId);
  if (percent === 0) return null;
  return (
    <View style={styles.progressSection}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>업로드 진행률</Text>
        <Text style={styles.progressPct}>
          {percent}%{etaSeconds ? `  ·  약 ${etaSeconds}초 남음` : ''}
        </Text>
      </View>
      <View style={styles.progressTrack} accessibilityLabel={`업로드 ${percent}% 완료`}>
        <View style={[styles.progressFill, { width: `${percent}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

export function RecordingDetailScreen({ navigation, route }: Props): React.ReactElement {
  const { id, queueId: paramQueueId } = route.params;
  const { items, removeItem, restoreItem, updateItem, toggleStar } = useRecordingListStore();
  const recording = items.find((r) => r.id === id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(recording?.title ?? '');

  // W2: 목록에서 queueId 없이 진입한 경우 로컬 DB에서 직접 조회
  const [resolvedQueueId, setResolvedQueueId] = useState<string | undefined>(paramQueueId);
  useEffect(() => {
    if (resolvedQueueId) return;
    (async () => {
      const recCol = database.get<LocalRecordingModel>('local_recordings');
      const localRecs = await recCol
        .query(Q.where('server_recording_id', id))
        .fetch()
        .catch(() => []);
      if (!localRecs[0]) return;
      const queueCol = database.get<LocalUploadQueueModel>('local_upload_queue');
      const queueItems = await queueCol
        .query(Q.where('recording_id', localRecs[0].id), Q.where('status', 'failed'))
        .fetch()
        .catch(() => []);
      if (queueItems[0]) setResolvedQueueId(queueItems[0].id);
    })();
  }, [id, resolvedQueueId]);

  if (!recording) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>녹음을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const actions = resolveDetailActions(recording);

  const onSaveTitle = async () => {
    if (!shouldSaveTitle(editedTitle, recording.title)) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateRecordingMeta(id, { title: editedTitle.trim() });
      updateItem(id, { title: editedTitle.trim() });
    } catch {
      Alert.alert('오류', '제목 저장에 실패했습니다.');
    }
    setIsEditingTitle(false);
  };

  // FR-10: 재전송 (upload 실패 전용)
  const onRetryUpload = async () => {
    if (!resolvedQueueId) return;
    try {
      await retryUpload(resolvedQueueId);
      updateItem(id, { uploadState: 'queued' });
      setResolvedQueueId(undefined); // 재전송 후 재조회 트리거
    } catch {
      Alert.alert('오류', '업로드 재전송 요청에 실패했습니다.');
    }
  };

  // FR-10: 재처리 (transcription 실패 전용)
  const onRetryTranscription = async () => {
    if (!recording.transcriptionId) {
      Alert.alert('오류', '재처리 식별자가 없어 STT 재처리를 요청할 수 없습니다.');
      return;
    }
    try {
      await retryTranscription(recording.transcriptionId);
      updateItem(id, { transcriptionState: 'queued' });
    } catch {
      Alert.alert('오류', 'STT 재처리 요청에 실패했습니다.');
    }
  };

  // C2: 업로드 완료 후 국외이전 동의 누락으로 STT가 not_requested에 머문 경우 수동 트리거
  const onRequestTranscription = async () => {
    try {
      await requestTranscription(id);
      updateItem(id, { transcriptionState: 'queued' });
    } catch {
      Alert.alert('오류', 'STT 요청에 실패했습니다.');
    }
  };

  // U1: 삭제 실패 시 롤백 + 토스트
  const onDeleteConfirm = async () => {
    setShowDeleteModal(false);
    removeItem(id);
    try {
      await softDeleteRecording(id);
      navigation.goBack();
    } catch {
      restoreItem(recording);
      Alert.alert('삭제 실패', '삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 날짜·시간 포맷 헬퍼
  const createdDate = new Date(recording.createdAt);
  const dateStr = createdDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = createdDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const durationStr = recording.durationMs
    ? `${Math.floor(recording.durationMs / 60000)}분 ${Math.floor((recording.durationMs % 60000) / 1000)}초`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <AppTopBar title="회의 상세" showBack starActive={recording.isStarred} onStar={() => toggleStar(id)} />
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

      {/* ── 제목 섹션 ── */}
      <View style={styles.titleSection}>
        {isEditingTitle ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.titleInput}
              value={editedTitle}
              onChangeText={setEditedTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onSaveTitle}
              accessibilityLabel="제목 입력"
            />
            <TouchableOpacity onPress={onSaveTitle} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.titleRow}
            onPress={() => setIsEditingTitle(true)}
            accessibilityLabel={`제목: ${recording.title}. 탭하여 편집`}
          >
            <Text style={styles.titleText}>{recording.title}</Text>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.metaText}>
          {dateStr} {timeStr}{durationStr ? `  ·  ${durationStr}` : ''}
        </Text>
      </View>

      {/* ── 내부망 안내 배너 ── */}
      <InternalOnlyBanner />

      {/* ── 3-track 상태 카드 ── */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>생성</Text>
          <StatusBadge track="recording" state={recording.recordingState} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>업로드</Text>
          <StatusBadge track="upload" state={recording.uploadState} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>변환</Text>
          <StatusBadge track="transcription" state={recording.transcriptionState} />
        </View>
      </View>

      {/* ── 업로드 진행률 ── */}
      {recording.uploadState === 'uploading' && (
        <UploadProgressSection recordingId={id} />
      )}

      {/* ── 액션 버튼 행 (재전송 / 재처리 / 전사 시작) ── */}
      {(actions.showRetryUpload || actions.showRetryTranscription || actions.showRequestTranscription) && (
        <View style={styles.actionRow}>
          {/* FR-10: 재전송 — upload 실패 시만 */}
          {actions.showRetryUpload && (
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={onRetryUpload}
              disabled={!resolvedQueueId}
              accessibilityLabel="업로드 재전송"
              accessibilityRole="button"
              accessibilityHint="업로드에 실패한 파일을 다시 전송합니다"
            >
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#DC2626' }}>↑ 재전송</Text>
            </TouchableOpacity>
          )}

          {/* FR-10: 재처리 — STT 실패 시만 */}
          {actions.showRetryTranscription && (
            <TouchableOpacity
              style={styles.actionBtnFilled}
              onPress={onRetryTranscription}
              accessibilityLabel="STT 재처리"
              accessibilityRole="button"
              accessibilityHint="음성 인식 처리를 다시 요청합니다"
            >
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#ffffff' }}>↻ 재처리</Text>
            </TouchableOpacity>
          )}

          {/* C2: 업로드 완료 + STT 미요청 — 동의 후 수동 전사 경로 */}
          {actions.showRequestTranscription && (
            <TouchableOpacity
              style={styles.actionBtnFilled}
              onPress={onRequestTranscription}
              accessibilityLabel="음성 변환 시작"
              accessibilityRole="button"
              accessibilityHint="음성 인식 처리를 요청합니다"
            >
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: '#ffffff' }}>변환 시작</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── 전사 결과 보기 CTA ── */}
      {recording.transcriptionState === 'completed' && (
        <TouchableOpacity
          style={styles.transcriptBtn}
          onPress={() => navigation.navigate('Transcript', { id: recording.id })}
          accessibilityLabel="음성 변환 내용 보기"
          accessibilityRole="button"
        >
          <Text style={styles.transcriptBtnText}>음성 변환 내용 보기</Text>
        </TouchableOpacity>
      )}

      {/* ── 메모 / 태그 ── */}
      {(recording.note != null || recording.tags.length > 0) && (
        <View style={styles.metaBlock}>
          {recording.note != null && (
            <>
              <Text style={styles.sectionLabel}>메모</Text>
              <Text style={styles.note}>{recording.note}</Text>
            </>
          )}
          {recording.tags.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>태그</Text>
              <View style={styles.tagRow}>
                {recording.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* ── 삭제 버튼 ── */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => setShowDeleteModal(true)}
        accessibilityLabel="이 녹음 삭제"
        accessibilityRole="button"
      >
        <Text style={styles.deleteBtnText}>삭제</Text>
      </TouchableOpacity>

      <DeleteConfirmModal
        visible={showDeleteModal}
        title={recording.title}
        onConfirm={onDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── 레이아웃 기본 ──
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 15, color: '#9CA3AF' },

  // ── 제목 섹션 ──
  titleSection: { marginBottom: 24, paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  titleText: { fontSize: 24, fontFamily: 'Pretendard-ExtraBold', color: '#111827', flex: 1, lineHeight: 30 },
  titleInput: { fontSize: 20, fontFamily: 'Pretendard-Bold', color: '#111827', borderBottomWidth: 2, borderBottomColor: '#111111', paddingBottom: 4, flex: 1 },
  editIcon: { fontSize: 16, color: '#585f6c', marginLeft: 8 },
  metaText: { fontSize: 15, fontFamily: 'Pretendard-Regular', color: '#585f6c', lineHeight: 22 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#111111', borderRadius: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Pretendard-SemiBold' },

  // ── 3-track 상태 카드 ──
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#111827' },

  // ── 업로드 진행률 ──
  progressSection: { marginHorizontal: 16, marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#374151' },
  progressPct: { fontSize: 13, color: '#111111', fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#111111', borderRadius: 3 },

  // ── 액션 버튼 행 ──
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  actionBtnOutline: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnFilled: {
    flex: 1,
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── 전사 결과 CTA ──
  transcriptBtn: {
    marginHorizontal: 16,
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  transcriptBtnText: { fontSize: 20, fontFamily: 'Pretendard-Bold', color: '#ffffff', lineHeight: 26 },

  // ── 메모 / 태그 ──
  metaBlock: { marginHorizontal: 16, marginBottom: 28 },
  sectionLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  note: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, color: '#111111', fontWeight: '500' },

  // ── 삭제 버튼 ──
  deleteBtn: { alignSelf: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  deleteBtnText: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#DC2626', opacity: 0.7 },

  // ── 내부망 안내 배너 ──
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  noticeIcon: { fontSize: 14, lineHeight: 16 },
  noticeText: { flex: 1, fontSize: 11, color: '#9a3412', lineHeight: 16 },
  noticeBold: { fontWeight: '800' },
});
