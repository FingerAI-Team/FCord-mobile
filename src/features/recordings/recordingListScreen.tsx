import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { useAuthStore } from '../../stores/authStore';
import { getRecordingList, getMeetingDetail, softDeleteRecording } from '../../api/recordings';
import { ServerRecordingCache, SortType, FilterType } from '../../types';
import { RecordingCard } from './recordingCard';
import { DeleteConfirmModal } from './deleteConfirmModal';
import { EMPTY_MESSAGES } from './recordingListConfig';
import { AppTopBar } from '../../components/AppTopBar';
import { resolveFabNavRoute } from '../../navigation/tabBarConfig';

export { EMPTY_MESSAGES };

// 필터 탭 레이블 맵
const FILTER_LABELS: Record<string, string> = {
  all: '전체', uploading: '업로드중', done: '완료', failed: '실패',
};

interface Props {
  navigation: any;
}

export function RecordingListScreen({ navigation }: Props): React.ReactElement {
  const {
    items, filter, sort, nextCursor, hasMore, isLoading, isRefreshing,
    setItems, appendItems, updateItem, removeItem, restoreItem,
    setFilter, setSort, setLoading, setRefreshing,
  } = useRecordingListStore();

  // 인사말 헤더에 표시할 사용자 이름
  const session = useAuthStore((s) => s.session);

  const SORT_LABELS: Record<SortType, string> = { recent: '최신순', duration: '길이순' };
  const onToggleSort = () => setSort(sort === 'recent' ? 'duration' : 'recent');

  const [deleteTarget, setDeleteTarget] = useState<ServerRecordingCache | null>(null);

  const onFabPress = async () => {
    let granted = false;
    if (Platform.OS === 'ios') {
      const current = await check(PERMISSIONS.IOS.MICROPHONE);
      if (current === RESULTS.GRANTED) {
        granted = true;
      } else {
        const result = await request(PERMISSIONS.IOS.MICROPHONE);
        granted = result === RESULTS.GRANTED;
      }
    } else {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: '마이크 권한 필요',
        message: '녹음을 위해 마이크 접근 권한이 필요합니다.',
        buttonPositive: '허용',
        buttonNegative: '거부',
      });
      granted = result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const route = resolveFabNavRoute(granted);
    if (route === 'permission_denied') {
      Alert.alert('권한 필요', '마이크 권한이 필요합니다. 설정에서 허용해주세요.');
      return;
    }
    navigation.navigate(route as never);
  };

  const loadList = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoading(true);
      }
      try {
        const res = await getRecordingList({ filter, sort, cursor, limit: 20 });
        if (cursor) {
          appendItems(res.items, res.next_cursor);
        } else {
          setItems(res.items, res.next_cursor);
        }
      } catch {
        // 에러: 기존 캐시 유지
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, sort, appendItems, setItems, setLoading, setRefreshing],
  );

  useEffect(() => {
    setLoading(true);
    loadList();
  }, [filter, sort, loadList, setLoading]);

  // 포그라운드 복귀 시 목록 자동 갱신
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') loadList();
    });
    return () => sub.remove();
  }, [loadList]);

  // processing 항목이 있으면 30초마다 개별 상태 폴링
  const processingKey = useMemo(
    () => items.filter((i) => i.transcriptionState === 'processing').map((i) => i.id).join(','),
    [items],
  );
  const processingKeyRef = useRef(processingKey);
  processingKeyRef.current = processingKey;

  useEffect(() => {
    if (!processingKey) return;

    const poll = async () => {
      const ids = processingKeyRef.current.split(',').filter(Boolean);
      for (const id of ids) {
        try {
          const detail = await getMeetingDetail(id);
          if (detail && detail.transcriptionState !== 'processing') {
            updateItem(id, { transcriptionState: detail.transcriptionState });
          }
        } catch {
          // 폴링 실패는 무시 (다음 사이클에 재시도)
        }
      }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [processingKey, updateItem]);

  const onRefresh = () => {
    if (isRefreshing) return;
    setRefreshing(true);
    loadList();
  };

  const onEndReached = () => {
    if (hasMore && !isLoading && !isRefreshing && nextCursor) {
      loadList(nextCursor);
    }
  };

  // U1: 삭제 실패 시 롤백 + 토스트
  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    removeItem(target.id); // 로컬 즉시 숨김
    try {
      await softDeleteRecording(target.id);
    } catch {
      restoreItem(target); // 서버 실패 → 복원
      Alert.alert('삭제 실패', '삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const renderItem = ({ item }: { item: ServerRecordingCache }) => (
    <RecordingCard
      item={item}
      onPress={() => navigation.navigate('RecordingDetail', { id: item.id })}
      onDelete={() => setDeleteTarget(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{EMPTY_MESSAGES[filter]}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppTopBar title="IBKS 음성회의록" active="home" />

      {/* 인사말 헤더 */}
      <View style={styles.homeHeader}>
        <Text style={styles.greetingMeta}>오늘 회의 {items.length}건</Text>
        <Text style={styles.greetingName}>{session?.user?.name ?? '안녕하세요'} 님</Text>
      </View>

      {/* 필터 row */}
      <View style={styles.filterRow}>
        <View style={styles.filterPills}>
          {(['all', 'uploading', 'done', 'failed'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f }}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={onToggleSort}
          accessibilityLabel={`정렬 기준: ${SORT_LABELS[sort]}. 탭하여 변경`}
          accessibilityRole="button"
        >
          <Text style={styles.sortBtnText}>{SORT_LABELS[sort]} ↕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item: ServerRecordingCache) => item.id}
        renderItem={renderItem}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />

      <DeleteConfirmModal
        visible={deleteTarget != null}
        title={deleteTarget?.title ?? ''}
        onConfirm={onDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 하단 회의 시작 버튼 (데모 v4 tabbar 스타일) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={onFabPress}
          accessibilityLabel="회의 시작하기"
          accessibilityRole="button"
        >
          <Text style={styles.startBtnIcon}>🎙</Text>
          <Text style={styles.startBtnText}>회의 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  homeHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fcf8fa',
  },
  greetingMeta: {
    fontSize: 13,
    fontFamily: 'HankenGrotesk-SemiBold',
    color: '#585f6c',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 32,
    fontFamily: 'HankenGrotesk-ExtraBold',
    color: '#000000',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fcf8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterPills: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f6f3f4',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#000000' },
  pillText: { fontSize: 13, fontFamily: 'HankenGrotesk-SemiBold', color: '#585f6c' },
  pillTextActive: { color: '#ffffff' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  sortBtnText: { fontSize: 13, fontFamily: 'HankenGrotesk-SemiBold', color: '#585f6c' },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  emptyList: { flexGrow: 1 },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  startBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startBtnIcon: { fontSize: 22 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { fontSize: 26 },
});
