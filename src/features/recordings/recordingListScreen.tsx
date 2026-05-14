import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { getRecordingList, softDeleteRecording } from '../../api/recordings';
import { ServerRecordingCache, SortType } from '../../types';
import { RecordingCard } from './recordingCard';
import { FilterTabs } from './filterTabs';
import { DeleteConfirmModal } from './deleteConfirmModal';
import { EMPTY_MESSAGES } from './recordingListConfig';

export { EMPTY_MESSAGES };

interface Props {
  navigation: any;
}

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
});
