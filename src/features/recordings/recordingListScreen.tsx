import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useRecordingListStore, toApiFilter } from '../../stores/recordingListStore';
import { useAuthStore } from '../../stores/authStore';
import { getRecordingList, getMeetingDetail, softDeleteRecording } from '../../api/recordings';
import { ServerRecordingCache, SortType, FilterType } from '../../types';
import { RecordingCard } from './recordingCard';
import { DeleteConfirmModal } from './deleteConfirmModal';
import { EMPTY_MESSAGES } from './recordingListConfig';
import { AppTopBar } from '../../components/AppTopBar';
import { resolveFabNavRoute } from '../../navigation/tabBarConfig';

export { EMPTY_MESSAGES };

const FILTER_LABELS: Record<FilterType, string> = {
  all: '전체', processing: '변환중', done: '완료', starred: '즐겨찾기',
};

// 클라이언트 사이드 필터 적용
function applyFilter(items: ServerRecordingCache[], filter: FilterType): ServerRecordingCache[] {
  switch (filter) {
    case 'processing':
      return items.filter(
        (i) =>
          i.transcriptionState === 'processing' ||
          i.transcriptionState === 'queued' ||
          i.uploadState === 'uploading' ||
          i.uploadState === 'queued',
      );
    case 'done':
      return items.filter((i) => i.transcriptionState === 'completed');
    case 'starred':
      return items.filter((i) => i.isStarred);
    default:
      return items;
  }
}

interface Props {
  navigation: any;
}

export function RecordingListScreen({ navigation }: Props): React.ReactElement {
  const {
    items, filter, sort, searchQuery, nextCursor, hasMore, isLoading, isRefreshing,
    setItems, appendItems, updateItem, removeItem, restoreItem, toggleStar,
    setFilter, setSort, setSearchQuery, setLoading, setRefreshing,
  } = useRecordingListStore();

  const session = useAuthStore((s) => s.session);

  const SORT_LABELS: Record<SortType, string> = { recent: '최신순', duration: '길이순' };
  const onToggleSort = () => setSort(sort === 'recent' ? 'duration' : 'recent');

  const [deleteTarget, setDeleteTarget] = useState<ServerRecordingCache | null>(null);

  // 클라이언트 필터 + 검색어 적용
  const displayedItems = useMemo(() => {
    const filtered = applyFilter(items, filter);
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, filter, searchQuery]);

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
      if (cursor) setLoading(true);
      try {
        // starred/processing은 클라이언트 필터 → API에는 'all' 전달
        const res = await getRecordingList({ filter: toApiFilter(filter), sort, cursor, limit: 20 });
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
      onToggleStar={() => toggleStar(item.id)}
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

      {/* 검색바 */}
      <View style={styles.searchBarWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="회의 제목으로 검색"
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel="회의 검색"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="검색어 지우기">
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 필터 row */}
      <View style={styles.filterRow}>
        <View style={styles.filterPills}>
          {(['all', 'processing', 'done', 'starred'] as FilterType[]).map((f) => (
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
        data={displayedItems}
        keyExtractor={(item: ServerRecordingCache) => item.id}
        renderItem={renderItem}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={displayedItems.length === 0 ? styles.emptyList : undefined}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 14, color: '#888' },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#111',
    padding: 0,
  },
  searchClear: { fontSize: 13, color: '#aaa', paddingHorizontal: 4 },
  homeHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  greetingMeta: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: '#585f6c',
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 32,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#000000',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  filterPills: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 9999,
    padding: 4,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9999,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#111111' },
  pillText: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#585f6c' },
  pillTextActive: { color: '#ffffff' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  sortBtnText: { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#585f6c' },
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
    borderRadius: 16,
    backgroundColor: '#111111',
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
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 26 },
});
