import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { getRecordingList, softDeleteRecording } from '../../api/recordings';
import { ServerRecordingCache, FilterType, SortType } from '../../types';
import { RecordingCard } from './recordingCard';
import { FilterTabs } from './filterTabs';
import { DeleteConfirmModal } from './deleteConfirmModal';

interface Props {
  navigation: any;
}

const EMPTY_MESSAGES: Record<FilterType, string> = {
  all: '녹음을 시작해보세요',
  uploading: '업로드 중인 파일이 없습니다',
  done: '완료된 파일이 없습니다',
  failed: '실패한 파일이 없습니다',
};

export function RecordingListScreen({ navigation }: Props): React.ReactElement {
  const {
    items, filter, sort, nextCursor, hasMore, isLoading, isRefreshing,
    setItems, appendItems, removeItem, restoreItem,
    setFilter, setSort, setLoading, setRefreshing,
  } = useRecordingListStore();

  const SORT_LABELS: Record<SortType, string> = { recent: '최신순', duration: '길이순' };
  const onToggleSort = () => setSort(sort === 'recent' ? 'duration' : 'recent');

  const [deleteTarget, setDeleteTarget] = useState<ServerRecordingCache | null>(null);

  const loadList = useCallback(
    async (cursor?: string) => {
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

  const onRefresh = () => {
    setRefreshing(true);
    loadList();
  };

  const onEndReached = () => {
    if (hasMore && !isLoading && nextCursor) loadList(nextCursor);
  };

  // U3: FAB 탭 시 마이크 권한 체크 후 녹음 화면 이동 (가드레일 준수)
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

    if (!granted) {
      // 권한 거부 시 온보딩 화면으로 이동 (가드레일: 권한 없이 녹음 화면 진입 금지)
      navigation.navigate('PermissionOnboarding');
      return;
    }
    navigation.navigate('Recording');
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
    <View style={styles.container}>
      {/* W3: 필터 탭 + 정렬 토글을 한 행에 배치 */}
      <View style={styles.controlRow}>
        <FilterTabs active={filter} onChange={(f) => setFilter(f)} style={{ flex: 1, borderBottomWidth: 0 }} />
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />

      {/* FAB: 녹음 시작 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onFabPress}
        accessibilityLabel="새 녹음 시작"
        accessibilityRole="button"
      >
        <Text style={styles.fabIcon}>⏺</Text>
      </TouchableOpacity>

      <DeleteConfirmModal
        visible={deleteTarget != null}
        title={deleteTarget?.title ?? ''}
        onConfirm={onDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  controlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  sortBtnText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  emptyList: { flexGrow: 1 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: { fontSize: 22, color: '#FFFFFF' },
});
