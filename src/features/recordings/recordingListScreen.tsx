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

      {/* home-topbar: 인사말+아이콘+검색+필터 한 블록 (HTML .home-topbar 구조) */}
      <View style={styles.homeTopbar}>

        {/* home-topbar-row: 인사말(좌) + 아이콘(우) */}
        <View style={styles.homeTopbarRow}>
          <View>
            <Text style={styles.greetingName}>
              안녕하세요, {session?.user?.name ?? ''}님
            </Text>
            <Text style={styles.greetingMeta}>이번 주 회의 {items.length}건</Text>
          </View>
          <View style={styles.topbarIcons}>
            <TouchableOpacity
              style={[styles.topbarIconBtn, styles.topbarIconBtnActive]}
              onPress={() => navigation.navigate('Home' as never)}
              accessibilityLabel="홈" accessibilityRole="button"
            >
              <Text style={styles.topbarIconActive}>🏠</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topbarIconBtn}
              onPress={() => navigation.navigate('Library' as never)}
              accessibilityLabel="보관함" accessibilityRole="button"
            >
              <Text style={styles.topbarIcon}>📂</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topbarIconBtn}
              onPress={() => navigation.navigate('Settings' as never)}
              accessibilityLabel="설정" accessibilityRole="button"
            >
              <Text style={styles.topbarIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 검색바 */}
        <View style={styles.searchBarWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="회의 내용 검색..."
            placeholderTextColor="#bbb"
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

        {/* 필터 탭 (seg-filter) */}
        <View style={styles.filterPills}>
          {(['all', 'processing', 'done', 'starred'] as FilterType[]).map((f, idx, arr) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.pill,
                filter === f && styles.pillActive,
                idx === arr.length - 1 && styles.pillLast,
              ]}
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
  container: { flex: 1, backgroundColor: '#f4f6f9' },

  /* home-topbar: 인사말+아이콘+검색+필터 */
  homeTopbar: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#dde2eb',
  },
  homeTopbarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  greetingName: {
    fontSize: 15,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#0a1628',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  greetingMeta: {
    fontSize: 10,
    fontFamily: 'Pretendard-Regular',
    color: '#94a3b8',
  },
  topbarIcons: { flexDirection: 'row', gap: 4 },
  topbarIconBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#eef1f6',
    alignItems: 'center', justifyContent: 'center',
  },
  topbarIconBtnActive: { backgroundColor: '#0a1628' },
  topbarIcon: { fontSize: 13 },
  topbarIconActive: { fontSize: 13, color: '#fff' },

  /* search-bar */
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dde2eb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 10,
  },
  searchIcon: { fontSize: 11, color: '#bbb' },
  searchInput: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: '#0a1628',
    padding: 0,
  },
  searchClear: { fontSize: 11, color: '#aaa' },

  /* seg-filter */
  filterPills: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#dde2eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#dde2eb',
  },
  pillActive: { backgroundColor: '#0a1628' },
  pillLast: { borderRightWidth: 0 },
  pillText: { fontSize: 10, fontFamily: 'Pretendard-Bold', color: '#94a3b8' },
  pillTextActive: { color: '#fff' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 12, color: '#bbb', fontFamily: 'Pretendard-Regular' },
  emptyList: { flexGrow: 1 },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderTopColor: '#dde2eb',
  },
  startBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#005BAC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginVertical: 8,
  },
  startBtnIcon: { fontSize: 16 },
  startBtnText: { fontSize: 13, fontFamily: 'Pretendard-Bold', color: '#fff' },
  fab: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a1628',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  fabIcon: { fontSize: 22 },
});
