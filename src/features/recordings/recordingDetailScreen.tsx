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

interface Props {
  navigation: any;
  route: { params: { id: string; queueId?: string } };
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
  const { items, removeItem, restoreItem, updateItem } = useRecordingListStore();
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
    try {
      await retryTranscription(id);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 3-track 배지 블록 (상단 고정) */}
      <View style={styles.statusBlock}>
        <Text style={styles.sectionLabel}>상태</Text>
        <View style={styles.badgeRow}>
          <StatusBadge track="recording" state={recording.recordingState} />
          <StatusBadge track="upload" state={recording.uploadState} />
          <StatusBadge track="transcription" state={recording.transcriptionState} />
        </View>
      </View>

      {/* 업로드 진행률 */}
      {recording.uploadState === 'uploading' && (
        <UploadProgressSection recordingId={id} />
      )}

      {/* 재전송 버튼 — upload 실패 시만 */}
      {actions.showRetryUpload && (
        <View style={styles.actionRow}>
          <RetryUploadButton onPress={onRetryUpload} disabled={!resolvedQueueId} />
        </View>
      )}

      {/* 재처리 버튼 — STT 실패 시만 */}
      {actions.showRetryTranscription && (
        <View style={styles.actionRow}>
          <RetryTranscriptionButton onPress={onRetryTranscription} />
        </View>
      )}

      {/* C2: 업로드 완료 + STT 미요청 상태 — 동의 후 수동 전사 시작 경로 */}
      {actions.showRequestTranscription && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.sttRequestBtn}
            onPress={onRequestTranscription}
            accessibilityLabel="음성 전사 시작"
            accessibilityRole="button"
            accessibilityHint="음성 인식 처리를 요청합니다"
          >
            <Text style={styles.sttRequestText}>전사 시작</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 메타 정보 */}
      <View style={styles.metaBlock}>
        <Text style={styles.sectionLabel}>제목</Text>
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
          <TouchableOpacity onPress={() => setIsEditingTitle(true)} accessibilityLabel={`제목: ${recording.title}. 탭하여 편집`}>
            <Text style={styles.title}>{recording.title}</Text>
          </TouchableOpacity>
        )}

        {recording.note != null && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>메모</Text>
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

      {/* 전사 결과 이동 */}
      {actions.showViewTranscript && (
        <TouchableOpacity
          style={styles.viewTranscriptBtn}
          onPress={() => navigation.navigate('Transcript', { id })}
          accessibilityLabel="전사 결과 보기"
          accessibilityRole="button"
        >
          <Text style={styles.viewTranscriptText}>전사 결과 보기</Text>
        </TouchableOpacity>
      )}

      {/* 삭제 */}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 15, color: '#9CA3AF' },
  statusBlock: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  progressSection: { marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#374151' },
  progressPct: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#2563EB', borderRadius: 3 },
  actionRow: { marginBottom: 12 },
  metaBlock: { marginBottom: 28 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
    paddingVertical: 4,
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  note: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, color: '#2563EB', fontWeight: '500' },
  viewTranscriptBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewTranscriptText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sttRequestBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  sttRequestText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
